using Microsoft.UI.Xaml.Data;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts a DateTime or DateTimeOffset to a relative time string.
/// </summary>
/// <remarks>
/// Examples: "just now", "5 minutes ago", "2 hours ago", "3 days ago", etc.
/// Handles both singular and plural forms correctly.
/// </remarks>
public class DateToRelativeConverter : IValueConverter
{
    /// <summary>
    /// Converts a DateTime or DateTimeOffset to a relative time string.
    /// </summary>
    /// <param name="value">The DateTime or DateTimeOffset value to convert.</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>A relative time string like "5 minutes ago" or "just now".</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        DateTime dateTime = value switch
        {
            DateTime dt => dt,
            DateTimeOffset dto => dto.DateTime,
            _ => DateTime.MinValue
        };

        if (dateTime == DateTime.MinValue)
        {
            return string.Empty;
        }

        // Ensure we're comparing UTC times
        if (dateTime.Kind == DateTimeKind.Local)
        {
            dateTime = dateTime.ToUniversalTime();
        }

        var timeSpan = DateTime.UtcNow - dateTime;

        // Less than 1 minute
        if (timeSpan.TotalMinutes < 1)
        {
            return "just now";
        }

        // Less than 1 hour
        if (timeSpan.TotalHours < 1)
        {
            int minutes = (int)timeSpan.TotalMinutes;
            return minutes == 1 ? "1 minute ago" : $"{minutes} minutes ago";
        }

        // Less than 24 hours
        if (timeSpan.TotalDays < 1)
        {
            int hours = (int)timeSpan.TotalHours;
            return hours == 1 ? "1 hour ago" : $"{hours} hours ago";
        }

        // Less than 7 days
        if (timeSpan.TotalDays < 7)
        {
            int days = (int)timeSpan.TotalDays;
            return days == 1 ? "1 day ago" : $"{days} days ago";
        }

        // Less than 30 days
        if (timeSpan.TotalDays < 30)
        {
            int weeks = (int)(timeSpan.TotalDays / 7);
            return weeks == 1 ? "1 week ago" : $"{weeks} weeks ago";
        }

        // Less than 365 days
        if (timeSpan.TotalDays < 365)
        {
            int months = (int)(timeSpan.TotalDays / 30);
            return months == 1 ? "1 month ago" : $"{months} months ago";
        }

        // 365 days or more
        int years = (int)(timeSpan.TotalDays / 365);
        return years == 1 ? "1 year ago" : $"{years} years ago";
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
