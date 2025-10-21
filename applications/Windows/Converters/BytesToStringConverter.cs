using System;
using Microsoft.UI.Xaml.Data;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts a byte count to a human-readable string representation.
/// </summary>
/// <remarks>
/// Converts values like 1536 to "1.50 KB", 2097152 to "2.00 MB", etc.
/// Handles long, int, and double input types.
/// </remarks>
public class BytesToStringConverter : IValueConverter
{
    private static readonly string[] Units = ["B", "KB", "MB", "GB", "TB"];

    /// <summary>
    /// Converts a byte count to a human-readable string.
    /// </summary>
    /// <param name="value">The byte count (long, int, or double).</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>A formatted string like "1.50 MB" or "0 B" for zero/negative values.</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        double bytes = value switch
        {
            long longValue => longValue,
            int intValue => intValue,
            double doubleValue => doubleValue,
            _ => 0
        };

        if (bytes <= 0)
        {
            return "0 B";
        }

        int unitIndex = 0;
        double size = bytes;

        while (size >= 1024 && unitIndex < Units.Length - 1)
        {
            size /= 1024;
            unitIndex++;
        }

        return $"{size:0.##} {Units[unitIndex]}";
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
