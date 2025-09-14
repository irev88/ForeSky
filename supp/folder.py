import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from pathlib import Path
import json

class FolderStructureGenerator:
    def __init__(self, root):
        self.root = root
        self.root.title("Folder Structure & Content Generator")
        self.root.geometry("1200x800")
        
        # Variables
        self.base_folder = None
        self.selected_items = {}  # {path: {'include_structure': bool, 'include_content': bool, 'expand': bool}}
        self.file_extensions_to_include = ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.h', 
                                          '.txt', '.md', '.json', '.xml', '.yaml', '.yml']
        
        self.setup_ui()
        
    def setup_ui(self):
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=2)
        main_frame.rowconfigure(2, weight=1)
        
        # Top controls
        control_frame = ttk.LabelFrame(main_frame, text="Controls", padding="10")
        control_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(control_frame, text="Select Folder", command=self.select_folder).pack(side=tk.LEFT, padx=5)
        ttk.Button(control_frame, text="Generate Output", command=self.generate_output).pack(side=tk.LEFT, padx=5)
        ttk.Button(control_frame, text="Save to File", command=self.save_to_file).pack(side=tk.LEFT, padx=5)
        ttk.Button(control_frame, text="Clear All", command=self.clear_all).pack(side=tk.LEFT, padx=5)
        
        self.folder_label = ttk.Label(control_frame, text="No folder selected")
        self.folder_label.pack(side=tk.LEFT, padx=20)
        
        # File extensions filter
        ext_frame = ttk.LabelFrame(main_frame, text="File Extensions Filter", padding="10")
        ext_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Label(ext_frame, text="Include files with extensions (comma-separated):").pack(side=tk.LEFT, padx=5)
        self.ext_entry = ttk.Entry(ext_frame, width=50)
        self.ext_entry.pack(side=tk.LEFT, padx=5)
        self.ext_entry.insert(0, ", ".join(self.file_extensions_to_include))
        ttk.Button(ext_frame, text="Update Filter", command=self.update_extensions).pack(side=tk.LEFT, padx=5)
        
        # Left panel - File tree
        left_frame = ttk.LabelFrame(main_frame, text="File Browser", padding="10")
        left_frame.grid(row=2, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 5))
        
        # Tree view with scrollbars
        tree_frame = ttk.Frame(left_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        self.tree_scroll_y = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL)
        self.tree_scroll_x = ttk.Scrollbar(tree_frame, orient=tk.HORIZONTAL)
        
        self.tree = ttk.Treeview(tree_frame, 
                                 yscrollcommand=self.tree_scroll_y.set,
                                 xscrollcommand=self.tree_scroll_x.set,
                                 selectmode='extended')
        
        self.tree_scroll_y.config(command=self.tree.yview)
        self.tree_scroll_x.config(command=self.tree.xview)
        
        self.tree_scroll_y.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree_scroll_x.pack(side=tk.BOTTOM, fill=tk.X)
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Tree columns
        self.tree['columns'] = ('type', 'include_structure', 'include_content', 'expand')
        self.tree.column('#0', width=300, minwidth=200)
        self.tree.column('type', width=80, minwidth=50)
        self.tree.column('include_structure', width=120, minwidth=100)
        self.tree.column('include_content', width=120, minwidth=100)
        self.tree.column('expand', width=100, minwidth=80)
        
        self.tree.heading('#0', text='Name')
        self.tree.heading('type', text='Type')
        self.tree.heading('include_structure', text='Show in Structure')
        self.tree.heading('include_content', text='Include Content')
        self.tree.heading('expand', text='Expand Folder')
        
        # Bind events
        self.tree.bind('<Double-Button-1>', self.on_item_double_click)
        self.tree.bind('<Button-3>', self.show_context_menu)  # Right-click
        
        # Buttons for tree control
        button_frame = ttk.Frame(left_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(button_frame, text="Select All", command=self.select_all).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Deselect All", command=self.deselect_all).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Toggle Structure", command=self.toggle_structure).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Toggle Content", command=self.toggle_content).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Toggle Expand", command=self.toggle_expand).pack(side=tk.LEFT, padx=2)
        
        # Right panel - Preview
        right_frame = ttk.LabelFrame(main_frame, text="Output Preview", padding="10")
        right_frame.grid(row=2, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.preview_text = scrolledtext.ScrolledText(right_frame, wrap=tk.NONE, width=80, height=40)
        self.preview_text.pack(fill=tk.BOTH, expand=True)
        
        # Status bar
        self.status_bar = ttk.Label(main_frame, text="Ready", relief=tk.SUNKEN)
        self.status_bar.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))
        
    def select_folder(self):
        folder = filedialog.askdirectory(title="Select Folder to Analyze")
        if folder:
            self.base_folder = folder
            self.folder_label.config(text=f"Selected: {os.path.basename(folder)}")
            self.populate_tree()
            self.status_bar.config(text=f"Loaded folder: {folder}")
            
    def populate_tree(self):
        self.tree.delete(*self.tree.get_children())
        self.selected_items.clear()
        
        if not self.base_folder:
            return
            
        root_name = os.path.basename(self.base_folder)
        root_item = self.tree.insert('', 'end', text=root_name, values=('folder', '✓', '', '✓'))
        self.selected_items[self.base_folder] = {
            'include_structure': True, 
            'include_content': False, 
            'expand': True,
            'is_folder': True
        }
        
        self.add_tree_items(root_item, self.base_folder)
        self.tree.item(root_item, open=True)
        
    def add_tree_items(self, parent, path):
        try:
            items = []
            for item in os.listdir(path):
                if item.startswith('.'):  # Skip hidden files
                    continue
                item_path = os.path.join(path, item)
                items.append((item, item_path, os.path.isdir(item_path)))
            
            # Sort: folders first, then files
            items.sort(key=lambda x: (not x[2], x[0].lower()))
            
            for item_name, item_path, is_dir in items:
                if is_dir:
                    tree_item = self.tree.insert(parent, 'end', text=item_name, 
                                                values=('folder', '✓', '', '✓'))
                    self.selected_items[item_path] = {
                        'include_structure': True,
                        'include_content': False,
                        'expand': True,
                        'is_folder': True
                    }
                    # Recursively add children
                    self.add_tree_items(tree_item, item_path)
                else:
                    ext = os.path.splitext(item_name)[1]
                    include_content = ext in self.file_extensions_to_include
                    content_mark = '✓' if include_content else ''
                    
                    tree_item = self.tree.insert(parent, 'end', text=item_name,
                                                values=('file', '✓', content_mark, ''))
                    self.selected_items[item_path] = {
                        'include_structure': True,
                        'include_content': include_content,
                        'expand': False,
                        'is_folder': False
                    }
        except PermissionError:
            pass
            
    def on_item_double_click(self, event):
        selected = self.tree.selection()
        if not selected:
            return
            
        item = selected[0]
        path = self.get_item_path(item)
        
        if path in self.selected_items:
            # Toggle the clicked column
            col = self.tree.identify_column(event.x)
            
            if col == '#3':  # include_structure column
                self.selected_items[path]['include_structure'] = not self.selected_items[path]['include_structure']
                self.tree.set(item, 'include_structure', '✓' if self.selected_items[path]['include_structure'] else '')
            elif col == '#4':  # include_content column
                if not self.selected_items[path]['is_folder']:
                    self.selected_items[path]['include_content'] = not self.selected_items[path]['include_content']
                    self.tree.set(item, 'include_content', '✓' if self.selected_items[path]['include_content'] else '')
            elif col == '#5':  # expand column
                if self.selected_items[path]['is_folder']:
                    self.selected_items[path]['expand'] = not self.selected_items[path]['expand']
                    self.tree.set(item, 'expand', '✓' if self.selected_items[path]['expand'] else '')
                    
    def get_item_path(self, item):
        path_parts = []
        while item:
            path_parts.insert(0, self.tree.item(item)['text'])
            item = self.tree.parent(item)
        
        if path_parts:
            path_parts[0] = self.base_folder
            return os.path.join(*path_parts) if len(path_parts) > 1 else self.base_folder
        return None
        
    def show_context_menu(self, event):
        # Create context menu
        menu = tk.Menu(self.root, tearoff=0)
        menu.add_command(label="Toggle Structure", command=self.toggle_structure_selected)
        menu.add_command(label="Toggle Content", command=self.toggle_content_selected)
        menu.add_command(label="Toggle Expand", command=self.toggle_expand_selected)
        menu.add_separator()
        menu.add_command(label="Select Children", command=self.select_children)
        menu.add_command(label="Deselect Children", command=self.deselect_children)
        
        menu.post(event.x_root, event.y_root)
        
    def toggle_structure_selected(self):
        for item in self.tree.selection():
            path = self.get_item_path(item)
            if path in self.selected_items:
                self.selected_items[path]['include_structure'] = not self.selected_items[path]['include_structure']
                self.tree.set(item, 'include_structure', '✓' if self.selected_items[path]['include_structure'] else '')
                
    def toggle_content_selected(self):
        for item in self.tree.selection():
            path = self.get_item_path(item)
            if path in self.selected_items and not self.selected_items[path]['is_folder']:
                self.selected_items[path]['include_content'] = not self.selected_items[path]['include_content']
                self.tree.set(item, 'include_content', '✓' if self.selected_items[path]['include_content'] else '')
                
    def toggle_expand_selected(self):
        for item in self.tree.selection():
            path = self.get_item_path(item)
            if path in self.selected_items and self.selected_items[path]['is_folder']:
                self.selected_items[path]['expand'] = not self.selected_items[path]['expand']
                self.tree.set(item, 'expand', '✓' if self.selected_items[path]['expand'] else '')
                
    def select_children(self):
        for item in self.tree.selection():
            self.set_children_selection(item, True)
            
    def deselect_children(self):
        for item in self.tree.selection():
            self.set_children_selection(item, False)
            
    def set_children_selection(self, item, select):
        children = self.tree.get_children(item)
        for child in children:
            path = self.get_item_path(child)
            if path in self.selected_items:
                self.selected_items[path]['include_structure'] = select
                self.tree.set(child, 'include_structure', '✓' if select else '')
                if not self.selected_items[path]['is_folder']:
                    ext = os.path.splitext(path)[1]
                    if ext in self.file_extensions_to_include:
                        self.selected_items[path]['include_content'] = select
                        self.tree.set(child, 'include_content', '✓' if select else '')
            self.set_children_selection(child, select)
            
    def select_all(self):
        self.set_all_selection(True)
        
    def deselect_all(self):
        self.set_all_selection(False)
        
    def set_all_selection(self, select):
        for item in self.tree.get_children():
            self.set_item_and_children_selection(item, select)
            
    def set_item_and_children_selection(self, item, select):
        path = self.get_item_path(item)
        if path in self.selected_items:
            self.selected_items[path]['include_structure'] = select
            self.tree.set(item, 'include_structure', '✓' if select else '')
            if not self.selected_items[path]['is_folder']:
                ext = os.path.splitext(path)[1]
                if ext in self.file_extensions_to_include:
                    self.selected_items[path]['include_content'] = select
                    self.tree.set(item, 'include_content', '✓' if select else '')
        
        for child in self.tree.get_children(item):
            self.set_item_and_children_selection(child, select)
            
    def toggle_structure(self):
        selected = self.tree.selection()
        if selected:
            self.toggle_structure_selected()
        else:
            # Toggle all
            any_selected = any(item['include_structure'] for item in self.selected_items.values())
            self.set_all_selection(not any_selected)
            
    def toggle_content(self):
        selected = self.tree.selection()
        if selected:
            self.toggle_content_selected()
        else:
            # Toggle all file contents
            for path, item in self.selected_items.items():
                if not item['is_folder']:
                    ext = os.path.splitext(path)[1]
                    if ext in self.file_extensions_to_include:
                        item['include_content'] = not item['include_content']
                        # Update tree display
                        self.update_tree_display()
                        
    def toggle_expand(self):
        selected = self.tree.selection()
        if selected:
            self.toggle_expand_selected()
        else:
            # Toggle all folders
            for path, item in self.selected_items.items():
                if item['is_folder']:
                    item['expand'] = not item['expand']
            self.update_tree_display()
            
    def update_tree_display(self):
        def update_item(tree_item):
            path = self.get_item_path(tree_item)
            if path in self.selected_items:
                item = self.selected_items[path]
                self.tree.set(tree_item, 'include_structure', '✓' if item['include_structure'] else '')
                self.tree.set(tree_item, 'include_content', '✓' if item['include_content'] else '')
                self.tree.set(tree_item, 'expand', '✓' if item['expand'] else '')
            
            for child in self.tree.get_children(tree_item):
                update_item(child)
                
        for item in self.tree.get_children():
            update_item(item)
            
    def update_extensions(self):
        ext_text = self.ext_entry.get()
        self.file_extensions_to_include = [ext.strip() for ext in ext_text.split(',') if ext.strip()]
        
        # Update content selection based on new extensions
        for path, item in self.selected_items.items():
            if not item['is_folder']:
                ext = os.path.splitext(path)[1]
                item['include_content'] = ext in self.file_extensions_to_include
                
        self.update_tree_display()
        self.status_bar.config(text="File extensions filter updated")
        
    def is_path_under_collapsed_folder(self, file_path):
        """Check if a file is under any collapsed (expand=False) folder"""
        # Get all parent directories of the file
        current_path = os.path.dirname(file_path)
        
        while current_path and current_path != self.base_folder:
            # Check if this parent folder exists in selected_items and has expand=False
            if current_path in self.selected_items:
                if self.selected_items[current_path]['is_folder'] and not self.selected_items[current_path]['expand']:
                    return True
            # Move up to parent directory
            parent = os.path.dirname(current_path)
            if parent == current_path:  # Reached root
                break
            current_path = parent
            
        return False
        
    def generate_output(self):
        if not self.base_folder:
            messagebox.showwarning("No Folder", "Please select a folder first")
            return
            
        output = self.generate_structure_output()
        self.preview_text.delete(1.0, tk.END)
        self.preview_text.insert(1.0, output)
        self.status_bar.config(text="Output generated successfully")
        
    def generate_structure_output(self):
        output = []
        output.append("<PROJECT FOLDER STRUCTURE>")
        
        # Generate folder structure
        structure_lines = self.generate_folder_structure(self.base_folder, "", True)
        output.extend(structure_lines)
        
        # Generate file contents
        output.append("\n<SELECTED FILES>")
        
        # Filter files: only include content if:
        # 1. File has include_content=True
        # 2. File is NOT under any collapsed folder
        content_files = []
        for path, item in self.selected_items.items():
            if not item['is_folder'] and item['include_content']:
                # Check if this file is under any collapsed folder
                if not self.is_path_under_collapsed_folder(path):
                    content_files.append(path)
        
        if not content_files:
            output.append("(No file contents to display)")
        else:
            for file_path in content_files:
                rel_path = os.path.relpath(file_path, os.path.dirname(self.base_folder))
                output.append(f"\n{rel_path}")
                output.append("-" * 50)
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        output.append(content)
                except Exception as e:
                    output.append(f"Error reading file: {str(e)}")
                    
                output.append("")
            
        return "\n".join(output)
        
    def generate_folder_structure(self, path, prefix="", is_last=True):
        lines = []
        
        if path not in self.selected_items or not self.selected_items[path]['include_structure']:
            return lines
            
        # Get the display name
        if path == self.base_folder:
            name = os.path.basename(path) + "/"
            lines.append(name)
            new_prefix = ""
        else:
            name = os.path.basename(path)
            if self.selected_items[path]['is_folder']:
                name += "/"
                
            connector = "└─ " if is_last else "├─ "
            lines.append(prefix + connector + name)
            
            if is_last:
                new_prefix = prefix + "   "
            else:
                new_prefix = prefix + "│  "
                
        # If it's a folder and should be expanded
        if self.selected_items[path]['is_folder'] and self.selected_items[path]['expand']:
            try:
                items = []
                for item in os.listdir(path):
                    if item.startswith('.'):
                        continue
                    item_path = os.path.join(path, item)
                    if item_path in self.selected_items and self.selected_items[item_path]['include_structure']:
                        items.append((item, item_path, os.path.isdir(item_path)))
                
                # Sort: folders first, then files
                items.sort(key=lambda x: (not x[2], x[0].lower()))
                
                for i, (item_name, item_path, is_dir) in enumerate(items):
                    is_last_item = (i == len(items) - 1)
                    child_lines = self.generate_folder_structure(item_path, new_prefix, is_last_item)
                    lines.extend(child_lines)
                    
            except PermissionError:
                lines.append(new_prefix + "└─ ... (permission denied)")
        elif self.selected_items[path]['is_folder'] and not self.selected_items[path]['expand']:
            lines.append(new_prefix + "└─ ... (content omitted)")
            
        return lines
        
    def save_to_file(self):
        if not self.preview_text.get(1.0, tk.END).strip():
            messagebox.showwarning("No Content", "Please generate output first")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            title="Save Output As"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(self.preview_text.get(1.0, tk.END))
                messagebox.showinfo("Success", f"Output saved to {file_path}")
                self.status_bar.config(text=f"Saved to: {file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save file: {str(e)}")
                
    def clear_all(self):
        self.tree.delete(*self.tree.get_children())
        self.selected_items.clear()
        self.preview_text.delete(1.0, tk.END)
        self.base_folder = None
        self.folder_label.config(text="No folder selected")
        self.status_bar.config(text="Cleared all data")

def main():
    root = tk.Tk()
    app = FolderStructureGenerator(root)
    root.mainloop()

if __name__ == "__main__":
    main()