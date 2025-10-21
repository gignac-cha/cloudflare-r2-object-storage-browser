using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Linq;

namespace CloudflareR2Browser.Views;

/// <summary>
/// Breadcrumb view for path navigation.
/// </summary>
public sealed partial class BreadcrumbView : UserControl, INotifyPropertyChanged
{
    private List<string> _breadcrumbItems = new();

    /// <summary>
    /// Gets the ViewModel from DataContext.
    /// </summary>
    public FileListViewModel? ViewModel => DataContext as FileListViewModel;

    /// <summary>
    /// Gets the breadcrumb items for display.
    /// </summary>
    public List<string> BreadcrumbItems
    {
        get => _breadcrumbItems;
        private set
        {
            if (_breadcrumbItems != value)
            {
                _breadcrumbItems = value;
                OnPropertyChanged();
            }
        }
    }

    /// <summary>
    /// Initializes a new instance of the BreadcrumbView class.
    /// </summary>
    public BreadcrumbView()
    {
        this.InitializeComponent();

        // Subscribe to DataContext changes
        this.DataContextChanged += (s, e) =>
        {
            OnPropertyChanged(nameof(ViewModel));

            if (ViewModel != null)
            {
                // Subscribe to property changes
                ViewModel.PropertyChanged += ViewModel_PropertyChanged;

                // Initial update
                UpdateBreadcrumbs();
            }
        };
    }

    /// <summary>
    /// Updates breadcrumbs when ViewModel properties change.
    /// </summary>
    private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(FileListViewModel.CurrentBucket) ||
            e.PropertyName == nameof(FileListViewModel.CurrentPath))
        {
            UpdateBreadcrumbs();
        }
    }

    /// <summary>
    /// Updates the breadcrumb items based on current path.
    /// </summary>
    private void UpdateBreadcrumbs()
    {
        if (ViewModel == null) return;

        var items = new List<string>();

        // Add home icon
        items.Add("🏠");

        // Add bucket name if selected
        if (!string.IsNullOrEmpty(ViewModel.CurrentBucket))
        {
            items.Add(ViewModel.CurrentBucket);

            // Add path segments
            if (!string.IsNullOrEmpty(ViewModel.CurrentPath))
            {
                var parts = ViewModel.CurrentPath
                    .Split('/', System.StringSplitOptions.RemoveEmptyEntries);
                items.AddRange(parts);
            }
        }

        BreadcrumbItems = items;
    }

    /// <summary>
    /// Handles breadcrumb item clicks for navigation.
    /// </summary>
    private void PathBreadcrumb_ItemClicked(BreadcrumbBar sender, BreadcrumbBarItemClickedEventArgs args)
    {
        if (ViewModel == null) return;

        var index = args.Index;

        if (index == 0)
        {
            // Home - clear selection
            return;
        }

        if (index == 1)
        {
            // Bucket root - navigate to bucket root
            _ = ViewModel.NavigateToPathAsync("");
            return;
        }

        // Navigate to specific folder
        var pathSegments = BreadcrumbItems.Skip(2).Take(index - 1);
        var targetPath = string.Join('/', pathSegments) + "/";
        _ = ViewModel.NavigateToPathAsync(targetPath);
    }

    #region INotifyPropertyChanged

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    #endregion
}
