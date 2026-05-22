<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #1f2937; padding: 40px; }
        .header { margin-bottom: 24px; }
        .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .header p { font-size: 13px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f3f4f6; font-weight: 600; text-align: left; padding: 8px 12px; border: 1px solid #d1d5db; }
        td { padding: 6px 12px; border: 1px solid #d1d5db; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Generated: {{ $generated_at }}</p>
    </div>
    <table>
        <thead>
            <tr>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($headers as $i => $header)
                        <td>{{ is_array($row) ? ($row[array_keys($row)[$i] ?? $i] ?? '') : (property_exists($row, array_keys((array)$row)[$i] ?? '') ? $row->{array_keys((array)$row)[$i] ?? ''} : '') }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headers) }}" style="text-align:center;color:#9ca3af;">No data available</td>
                </tr>
            @endforelse
        </tbody>
    </table>
    <div class="footer">Internal Task Manager &mdash; {{ $title }}</div>
</body>
</html>
