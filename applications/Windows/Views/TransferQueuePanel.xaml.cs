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
    /// Gets or sets the ViewModel for this view.
    /// </summary>
    public TransferManagerViewModel ViewModel { get; set; }

    /// <summary>
    /// Initializes a new instance of the TransferQueuePanel class.
    /// </summary>
    public TransferQueuePanel()
    {
        this.InitializeComponent();
        ViewModel = null!; // Will be set via dependency injection
    }

    /// <summary>
    /// Sets the ViewModel and initializes the view.
    /// </summary>
    /// <param name="viewModel">The TransferManagerViewModel instance.</param>
    public void Initialize(TransferManagerViewModel viewModel)
    {
        ViewModel = viewModel;
    }
}
