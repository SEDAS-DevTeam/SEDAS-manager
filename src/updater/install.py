from utils import GuiApp

from PySide6.QtCore import Qt, Signal, QThread
from PySide6.QtWidgets import QLabel, QProgressBar

import time
import sys


class InstallThread(QThread):
    terminate_signal = Signal()
    progress_signal = Signal(int, str)

    n_iter_blocks = 3
    iter_block = int(100 / n_iter_blocks)
    curr_iter_block = 0

    def update_iter(self):
        self.curr_iter_block += self.iter_block
        return self.curr_iter_block

    def run(self):
        self.progress_signal.emit(self.update_iter(), "Unpacking app")
        time.sleep(2)

        self.progress_signal.emit(self.update_iter(), "Deploying files")
        time.sleep(2)

        self.progress_signal.emit(self.update_iter(), "Gimme some rest")
        time.sleep(3)

        self.terminate_signal.emit()


class InstallGui(GuiApp):
    def __init__(self):
        super().__init__("SEDAS Installation")

        self.graceful_exit = False
        self.app.aboutToQuit.connect(self.postinst_cleanup)

        # Label
        self.layout.addStretch(1)
        self.progress_label = QLabel("Hello world", self.central_widget, alignment=Qt.AlignmentFlag.AlignCenter)
        self.layout.addWidget(self.progress_label)

        # Progress Bar
        self.progress_bar = QProgressBar(self.central_widget)
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)

        self.layout.addWidget(self.progress_bar)
        self.layout.addStretch(1)

        # start app install
        print("Starting installation")
        self.install_thread = InstallThread()
        self.install_thread.terminate_signal.connect(self.exit_app)
        self.install_thread.progress_signal.connect(self.update_progress_bar)

        self.install_thread.start()

    def exit_app(self):
        self.graceful_exit = True
        self.main_window.close()

    def update_progress_bar(self, value, text):
        self.progress_bar.setValue(value)
        self.progress_label.setText(text)

    def postinst_cleanup(self):
        if not self.graceful_exit:
            print("User cancelled installation, cleaning up files")
            pass # Add some cleanups!


if __name__ == "__main__":
    main_app = InstallGui()
    main_app.mainloop()
    sys.exit(0)
