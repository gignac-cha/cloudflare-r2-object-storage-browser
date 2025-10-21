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
    /// Gets the ViewModel from DataContext.
    /// </summary>
    public DebugPanelViewModel? ViewModel => DataContext as DebugPanelViewModel;

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

                // Update ViewModel selected tab if ViewModel is available
                if (ViewModel != null)
                {
                    ViewModel.SelectedTab = value == 0
                        ? DebugPanelTab.ApiResponses
                        : DebugPanelTab.ServerLogs;
                }
            }
        }
    }

    /// <summary>
    /// Initializes a new instance of the DebugPanelView class.
    /// </summary>
    public DebugPanelView()
    {
        this.InitializeComponent();

        // Listen to DataContext changes
        this.DataContextChanged += (s, e) =>
        {
            OnPropertyChanged(nameof(ViewModel));

            // Sync tab selection when ViewModel is set
            if (ViewModel != null)
            {
                SelectedTabIndex = ViewModel.SelectedTab == DebugPanelTab.ApiResponses ? 0 : 1;
            }
        };
    }

    #region INotifyPropertyChanged

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    #endregion
}
