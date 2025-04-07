import sys
from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PySide6.QtGui import QPalette, QColor


def setup_layout(header, win_dims):
    window = QMainWindow()
    window.resize(*win_dims)
    window.setWindowTitle(header)

    # Create a central widget
    central_widget = QWidget(window)
    window.setCentralWidget(central_widget)

    # Setup layout
    layout = QVBoxLayout(central_widget)
    return window, central_widget, layout


class GuiApp:
    def __init__(self, header):
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

        self.main_window, self.central_widget, self.layout = setup_layout(header, (300, 150))

    def mainloop(self):
        self.main_window.show()
        self.app.exec()