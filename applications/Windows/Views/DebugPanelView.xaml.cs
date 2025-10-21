using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CloudflareR2Browser.Views;

/// <summary>
/// Debug panel view for API responses and server logs.
/// </summary>
public sealed partial class DebugPanelView : UserControl, INotifyPropertyChanged
{
    private int _selectedTabIndex;

    /// <summary>
    /// Gets or sets the ViewModel for this view.
    /// </summary>
    public DebugPanelViewModel ViewModel { get; set; }

    /// <summary>
    /// Gets or sets the selected tab index.
    /// </summary>
    public int SelectedTabIndex
    {
        get => _selectedTabIndex;
        set
        {
            if (_selectedTabIndex != value)
            {
                _selectedTabIndex = value;
                OnPropertyChanged();

                // Update ViewModel selected tab
                ViewModel.SelectedTab = value == 0
                    ? DebugPanelTab.ApiResponses
                    : DebugPanelTab.ServerLogs;
            }
        }
    }

    /// <summary>
    /// Initializes a new instance of the DebugPanelView class.
    /// </summary>
    public DebugPanelView()
    {
        this.InitializeComponent();
        ViewModel = null!; // Will be set via dependency injection
    }

    /// <summary>
    /// Sets the ViewModel and initializes the view.
    /// </summary>
    /// <param name="viewModel">The DebugPanelViewModel instance.</param>
    public void Initialize(DebugPanelViewModel viewModel)
    {
        ViewModel = viewModel;

        // Sync tab selection
        SelectedTabIndex = ViewModel.SelectedTab == DebugPanelTab.ApiResponses ? 0 : 1;
    }

    #region INotifyPropertyChanged

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    #endregion
}
