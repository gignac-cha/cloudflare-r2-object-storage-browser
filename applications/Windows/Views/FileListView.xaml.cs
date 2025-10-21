using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;
using CloudflareR2Browser.Models;
using System.Linq;

namespace CloudflareR2Browser.Views;

/// <summary>
/// File list view displaying objects and folders in the current bucket/path.
/// </summary>
public sealed partial class FileListView : UserControl
{
    /// <summary>
    /// Gets or sets the ViewModel for this view.
    /// </summary>
    public FileListViewModel ViewModel { get; set; }

    /// <summary>
    /// Initializes a new instance of the FileListView class.
    /// </summary>
    public FileListView()
    {
        this.InitializeComponent();
        ViewModel = null!; // Will be set via dependency injection
    }

    /// <summary>
    /// Sets the ViewModel and initializes the view.
    /// </summary>
    /// <param name="viewModel">The FileListViewModel instance.</param>
    public void Initialize(FileListViewModel viewModel)
    {
        ViewModel = viewModel;
    }

    /// <summary>
    /// Handles item click events (double-click to open folder).
    /// </summary>
    private void FileListView_ItemClick(object sender, ItemClickEventArgs e)
    {
        if (e.ClickedItem is R2Object obj)
        {
            // If it's a folder, navigate into it
            if (obj.IsFolder || obj.Key.EndsWith('/'))
            {
                _ = ViewModel.OpenFolderAsync(obj.Key);
            }
            else
            {
                // If it's a file, preview it
                ViewModel.PreviewObject(obj);
            }
        }
    }

    /// <summary>
    /// Handles selection changes to update the ViewModel's selected objects.
    /// </summary>
    private void FileListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        ViewModel.SelectedObjects.Clear();
        foreach (var item in ObjectListView.SelectedItems.Cast<R2Object>())
        {
            ViewModel.SelectedObjects.Add(item);
        }
    }
}
