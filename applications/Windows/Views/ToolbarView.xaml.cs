using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CloudflareR2Browser.Views;

/// <summary>
/// Toolbar view with navigation and action buttons.
/// </summary>
public sealed partial class ToolbarView : UserControl, INotifyPropertyChanged
{
    private bool _hasSelectedItems;
    private string _selectionText = "";

    /// <summary>
    /// Gets or sets the ViewModel for this view.
    /// </summary>
    public FileListViewModel ViewModel { get; set; }

    /// <summary>
    /// Gets whether there are selected items.
    /// </summary>
    public bool HasSelectedItems
    {
        get => _hasSelectedItems;
        private set
        {
            if (_hasSelectedItems != value)
            {
                _hasSelectedItems = value;
                OnPropertyChanged();
            }
        }
    }

    /// <summary>
    /// Gets the selection counter text.
    /// </summary>
    public string SelectionText
    {
        get => _selectionText;
        private set
        {
            if (_selectionText != value)
            {
                _selectionText = value;
                OnPropertyChanged();
            }
        }
    }

    /// <summary>
    /// Initializes a new instance of the ToolbarView class.
    /// </summary>
    public ToolbarView()
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

        // Subscribe to selection changes
        ViewModel.SelectedObjects.CollectionChanged += (s, e) =>
        {
            UpdateSelectionState();
        };
    }

    /// <summary>
    /// Updates the selection state and text.
    /// </summary>
    private void UpdateSelectionState()
    {
        var count = ViewModel.SelectedObjects.Count;
        HasSelectedItems = count > 0;
        SelectionText = count == 1 ? "1 item selected" : $"{count} items selected";
    }

    #region INotifyPropertyChanged

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    #endregion
}
