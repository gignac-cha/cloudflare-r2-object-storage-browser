using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;

namespace CloudflareR2Browser.Views;

/// <summary>
/// Transfer queue panel displaying upload, download, and delete operations.
/// </summary>
public sealed partial class TransferQueuePanel : UserControl
{
    /// <summary>
    /// Gets the ViewModel from DataContext.
    /// </summary>
    public TransferManagerViewModel? ViewModel => DataContext as TransferManagerViewModel;

    /// <summary>
    /// Initializes a new instance of the TransferQueuePanel class.
    /// </summary>
    public TransferQueuePanel()
    {
        this.InitializeComponent();
    }
}
