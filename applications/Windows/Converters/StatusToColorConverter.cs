using System;
using CloudflareR2Browser.Models;
using Microsoft.UI;
using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Media;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts TransferStatus or ServerState enum values to color brushes.
/// </summary>
/// <remarks>
/// Maps transfer and server states to appropriate color representations:
/// - Green for success/running states
/// - Red for error/failed states
/// - Blue for active operation states
/// - Orange for warning/transitional states
/// - Gray for neutral/unknown states
/// </remarks>
public class StatusToColorConverter : IValueConverter
{
    /// <summary>
    /// Converts a TransferStatus or ServerState to a color brush.
    /// </summary>
    /// <param name="value">The TransferStatus or ServerState enum value.</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>A SolidColorBrush with the appropriate color for the status.</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is TransferStatus status)
        {
            return status switch
            {
                TransferStatus.Completed => new SolidColorBrush(Colors.Green),
                TransferStatus.Failed => new SolidColorBrush(Colors.Red),
                TransferStatus.Cancelled => new SolidColorBrush(Colors.DarkGray),
                TransferStatus.Uploading or TransferStatus.Downloading or TransferStatus.Deleting => new SolidColorBrush(Colors.Blue),
                TransferStatus.Paused => new SolidColorBrush(Colors.Orange),
                TransferStatus.Queued => new SolidColorBrush(Colors.Gray),
                _ => new SolidColorBrush(Colors.Gray)
            };
        }

        if (value is ServerState serverState)
        {
            return serverState switch
            {
                ServerState.Running => new SolidColorBrush(Colors.Green),
                ServerState.Error => new SolidColorBrush(Colors.Red),
                ServerState.Starting or ServerState.Stopping => new SolidColorBrush(Colors.Orange),
                ServerState.Stopped => new SolidColorBrush(Colors.Gray),
                _ => new SolidColorBrush(Colors.Gray)
            };
        }

        return new SolidColorBrush(Colors.Gray);
    }

    /// <summary>
    /// ConvertBack is not supported for this converter.
    /// </summary>
    /// <exception cref="NotImplementedException">This converter does not support two-way binding.</exception>
    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        throw new NotImplementedException();
    }
}
