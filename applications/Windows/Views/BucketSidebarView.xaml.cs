using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;

namespace CloudflareR2Browser.Views;

/// <summary>
/// Bucket sidebar view displaying the list of R2 buckets.
/// </summary>
public sealed partial class BucketSidebarView : UserControl
{
    /// <summary>
    /// Gets or sets the ViewModel for this view.
    /// </summary>
    public BucketSidebarViewModel ViewModel { get; set; }

    /// <summary>
    /// Initializes a new instance of the BucketSidebarView class.
    /// </summary>
    public BucketSidebarView()
    {
        this.InitializeComponent();

        // ViewModel will be set via dependency injection or data context
        // This enables x:Bind to work properly
        ViewModel = null!; // Will be set before use
    }

    /// <summary>
    /// Sets the ViewModel and initializes the view.
    /// </summary>
    /// <param name="viewModel">The BucketSidebarViewModel instance.</param>
    public void Initialize(BucketSidebarViewModel viewModel)
    {
        ViewModel = viewModel;

        // Load buckets on initialization
        _ = ViewModel.LoadBucketsAsync();
    }
}
