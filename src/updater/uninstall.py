from utils import GuiApp, setup_layout, parse_args

from PySide6.QtCore import Qt, QThread, Signal, QEvent
from PySide6.QtWidgets import QLabel, QHBoxLayout, QPushButton, QPlainTextEdit

import sys
import time


class UninstallThread(QThread):
    terminate_signal = Signal()
    text_signal = Signal(str)

    def run(self):
        self.text_signal.emit("Deleting resources")
        time.sleep(1)
        self.text_signal.emit("Sleeping...")
        time.sleep(2)

        self.terminate_signal.emit()


class UninstallGui(GuiApp):
    def __init__(self, args: list[str]):
        super().__init__("SEDAS Uninstallation", args[0])

        self.graceful_exit = False
        self.app.aboutToQuit.connect(self.postuninst_cleanup)

        # Label
        self.layout.addStretch(1)
        self.progress_label = QLabel("Do you want to uninstall SEDAS?", self.central_widget, alignment=Qt.AlignmentFlag.AlignCenter)
        self.layout.addWidget(self.progress_label)

        self.hor_layout = QHBoxLayout()
        self.hor_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.button_yes = QPushButton("Yes", self.central_widget)
        self.button_no = QPushButton("No", self.central_widget)

        # adding callbacks to buttons
        self.button_yes.clicked.connect(self.uninstall_yes)
        self.button_no.clicked.connect(self.correct_exit)

        self.hor_layout.addWidget(self.button_yes)
        self.hor_layout.addWidget(self.button_no)

        self.layout.addLayout(self.hor_layout)

        self.layout.addStretch(1)

    def disable_button(self, button_obj: QPushButton):
        button_obj.setEnabled(False)
        button_obj.setStyleSheet("""
            QPushButton:disabled {
                background-color: #cccccc;
                color: #888888;
            }
        """)

    def add_progress(self, text: str):
        self.terminal_output.appendPlainText(text)

    def forced_exit(self, event: QEvent):
        self.exit_app()

    def after_uninstall_callback(self):
        coords: list[int] | None = self.get_location()
        self.info_window, self.central_widget, self.layout = setup_layout("Installation progress", [400, 100], coords)

        goodbye_text = "SEDAS uninstalled successfully, It was nice flying with you!" # :(
        self.info_label = QLabel(goodbye_text, self.central_widget, alignment=Qt.AlignmentFlag.AlignCenter)
        self.layout.addWidget(self.info_label)

        self.button_ok = QPushButton("Ok", self.central_widget)
        self.button_ok.clicked.connect(self.correct_exit)
        self.button_ok.setFixedWidth(200)
        self.layout.addWidget(self.button_ok, alignment=Qt.AlignmentFlag.AlignCenter)

        self.info_window.show()

    def correct_exit(self):
        self.graceful_exit = True
        self.exit_app()

    def uninstall_yes(self):
        self.main_window.close()

        coords: list[int] | None = self.get_location()
        self.uninstall_window, self.central_widget, self.layout = setup_layout("Installation progress", [300, 250], coords)
        self.main_label = QLabel("Uninstalling SEDAS...", self.central_widget, alignment=Qt.AlignmentFlag.AlignCenter)
        self.layout.addWidget(self.main_label)

        self.terminal_output = QPlainTextEdit()
        self.terminal_output.setReadOnly(True)
        self.terminal_output.setStyleSheet("""
            QPlainTextEdit {
                background-color: black;
                color: white;
            }
        """)

        self.layout.addWidget(self.terminal_output)

        self.uninstall_window.show()
        self.uninstall_window.closeEvent = self.forced_exit

        self.uninstall_thread = UninstallThread()
        self.uninstall_thread.terminate_signal.connect(self.after_uninstall_callback)
        self.uninstall_thread.text_signal.connect(self.add_progress)

        self.uninstall_thread.start()

    def exit_app(self):
        self.main_window.close()

        # NOTE: rework this
        try: self.uninstall_window.close()
        except AttributeError: pass

        try: self.info_window.close()
        except AttributeError: pass

    def postuninst_cleanup(self):
        if not self.graceful_exit:
            print("User cancelled installation, cleaning up files")
            pass # Add some cleanups!


if __name__ == "__main__":
    args: list[str] = parse_args()

    main_app = UninstallGui(args)
    main_app.mainloop()
    sys.exit(0)
