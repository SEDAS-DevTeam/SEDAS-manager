import sys
import json

from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PySide6.QtGui import QPalette, QColor, QScreen
from PySide6.QtCore import QRect, Qt
from typing import TypedDict, TypeAlias, Any

import os
os.environ["QT_QPA_PLATFORM"] = "xcb" # Default to the XWayland for manual positioning (https://bugreports.qt.io/browse/PYSIDE-2190)

# Aliases
JsonDict: TypeAlias = dict[str, Any]
class ScreenConfig(TypedDict):
    name: str
    width: int
    height: int
    pos_x: int
    pos_y: int
ScreenList: TypeAlias = dict[str, list[ScreenConfig]]


def read_json(path: str) -> JsonDict:
    with open(path, "r") as file:
        data: JsonDict = json.load(file)
        return data


def write_json(data: JsonDict, path: str) -> None:
    json_object: str = json.dumps(data, indent=4)
    with open(path, "w") as file:
        file.write(json_object)


def parse_args() -> list[str]:
    args: list[str] = sys.argv[1:]
    return args


def get_win_geometry() -> dict[str, list[ScreenConfig]]:
    screens: list[QScreen] = QApplication.screens()
    screen_configuration: dict[str, list[ScreenConfig]] = {
        "configuration": []
    }

    for screen in screens:
        geometry: QRect = screen.geometry()

        config: ScreenConfig = {
            "name": screen.name(),
            "width": geometry.width(),
            "height": geometry.height(),
            "pos_x": geometry.x(),
            "pos_y": geometry.y()
        }
        screen_configuration["configuration"].append(config)

    return screen_configuration


def setup_layout(header: str, win_dims: list[int], win_loc: list[int] | None) -> tuple[QMainWindow, QWidget, QVBoxLayout]:
    window = QMainWindow()
    window.setWindowFlags(Qt.WindowType.FramelessWindowHint)
    window.resize(*win_dims)
    if win_loc is not None: window.move(win_loc[0] - int(win_dims[0] / 2), win_loc[1] - int(win_dims[1] / 2))
    window.setWindowTitle(header)

    # Create a central widget
    central_widget = QWidget(window)
    window.setCentralWidget(central_widget)

    # Setup layout
    layout = QVBoxLayout(central_widget)
    return window, central_widget, layout


class GuiApp:
    def __init__(self, header: str, abs_path: str) -> None:
        # set to white always
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor("white"))
        palette.setColor(QPalette.ColorRole.WindowText, QColor("black"))
        palette.setColor(QPalette.ColorRole.Base, QColor("white"))
        palette.setColor(QPalette.ColorRole.Text, QColor("black"))
        palette.setColor(QPalette.ColorRole.Button, QColor("#f0f0f0"))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor("black"))

        self.app = QApplication(sys.argv)
        self.app.setPalette(palette)

        self.settings_path = os.path.join(abs_path, 'src/res/data/app/settings.json')
        self.monitor_config_path = os.path.join(abs_path, 'src/res/data/app/geometry.json')
        self.settings = read_json(self.settings_path)
        self.monitor_configuration = self.settings["controller_loc"]

        coords: list[int] | None = self.get_location()
        self.main_window, self.central_widget, self.layout = setup_layout(header, [300, 150], coords)

    def get_location(self) -> list[int] | None:
        win_config: dict[str, list[ScreenConfig]] = get_win_geometry()
        write_json(win_config, self.monitor_config_path) # write into configuration so that it is readable for upcoming SEDAS processes

        if self.monitor_configuration == "leftmost":
            for win in win_config["configuration"]:
                if win["pos_x"] == 0: return [int(win["width"] / 2), win["pos_y"] + int(win["height"] / 2)]
        elif self.monitor_configuration == "rightmost":
            rightmost_x: int = 0
            cum_rightmost_x: int = 0
            for win in win_config["configuration"]:
                cum_rightmost_x += win["pos_x"]
                if win["pos_x"] > rightmost_x: rightmost_x = win["pos_x"]

            for win in win_config["configuration"]:
                if win["pos_x"] == rightmost_x: return [cum_rightmost_x + int(win["width"] / 2), win["pos_y"] + int(win["height"] / 2)]
        else:
            # leaving configuration as is (None)
            return None

    def mainloop(self) -> None:
        self.main_window.show()
        self.app.exec()
