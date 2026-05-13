import tkinter as tk
from tkinter import filedialog, messagebox
import os

class Notepad:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Simple Text Editor")
        self.text_area = tk.Text(self.root)
        self.text_area.pack(fill=tk.BOTH, expand=True)

        # Menu bar
        menu_bar = tk.Menu(self.root)
        file_menu = tk.Menu(menu_bar, tearoff=0)
        file_menu.add_command(label="Open", command=self.open_file)
        file_menu.add_command(label="Save", command=self.save_file)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.exit_app)
        menu_bar.add_cascade(label="File", menu=file_menu)

        self.root.config(menu=menu_bar)

    def open_file(self):
        try:
            filepath = filedialog.askopenfilename(filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
            if filepath:
                with open(filepath, 'r') as file:
                    content = file.read()
                    self.text_area.delete('1.0', tk.END)
                    self.text_area.insert(tk.END, content)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open file: {e}")

    def save_file(self):
        try:
            filepath = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
            if filepath:
                with open(filepath, 'w') as file:
                    content = self.text_area.get('1.0', tk.END)
                    file.write(content)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save file: {e}")

    def exit_app(self):
        self.root.destroy()

if __name__ == "__main__":
    app = Notepad()
    app.root.mainloop()