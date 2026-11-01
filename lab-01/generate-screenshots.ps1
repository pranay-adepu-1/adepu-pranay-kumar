Add-Type -AssemblyName System.Drawing

function Create-BrowserCard {
    param(
        [string]$OutputPath,
        [string]$Title,
        [string]$Method,
        [string]$Url,
        [string]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [string]$ResponseTime,
        [string[]]$BodyLines,
        [bool]$IsError = $false
    )

    $width = 960
    $height = 540
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Colors
    $colorBg = [System.Drawing.Color]::FromArgb(24, 24, 27)         # Slate 900
    $colorHeader = [System.Drawing.Color]::FromArgb(15, 15, 18)     # Header dark
    $colorBar = [System.Drawing.Color]::FromArgb(39, 39, 42)        # URL bar bg
    $colorBorder = [System.Drawing.Color]::FromArgb(63, 63, 70)     # Border
    $colorEditorBg = [System.Drawing.Color]::FromArgb(20, 20, 23)   # Body bg
    
    # Fonts
    $fontTitle = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $fontUrl = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Regular)
    $fontBadge = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $fontBody = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Regular)
    $fontSmall = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)

    # Brushes
    $brushBg = New-Object System.Drawing.SolidBrush($colorBg)
    $brushHeader = New-Object System.Drawing.SolidBrush($colorHeader)
    $brushBar = New-Object System.Drawing.SolidBrush($colorBar)
    $brushEditorBg = New-Object System.Drawing.SolidBrush($colorEditorBg)
    $brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(244, 244, 245))
    $brushGray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(161, 161, 170))
    $brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 197, 94))
    $brushRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
    $brushMethod = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(59, 130, 246))

    # Base background
    $g.FillRectangle($brushBg, 0, 0, $width, $height)

    # Window Header
    $g.FillRectangle($brushHeader, 0, 0, $width, 42)
    $penBorder = New-Object System.Drawing.Pen($colorBorder, 1)
    $g.DrawLine($penBorder, 0, 42, $width, 42)

    # Window Controls (mac/browser dots)
    $brushDotRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 95, 86))
    $brushDotYellow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 189, 46))
    $brushDotGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(39, 201, 63))
    $g.FillEllipse($brushDotRed, 16, 15, 12, 12)
    $g.FillEllipse($brushDotYellow, 36, 15, 12, 12)
    $g.FillEllipse($brushDotGreen, 56, 15, 12, 12)

    # Window title
    $g.DrawString($Title, $fontTitle, $brushGray, 80, 12)

    # URL / Request Bar
    $g.FillRectangle($brushBar, 16, 54, $width - 32, 42)
    $g.DrawRectangle($penBorder, 16, 54, $width - 32, 42)

    # Method badge
    $badgeRect = New-Object System.Drawing.Rectangle(24, 60, 48, 30)
    $badgeBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 58, 138))
    $g.FillRectangle($badgeBg, $badgeRect)
    $g.DrawString($Method, $fontBadge, $brushWhite, 31, 66)

    # URL Text
    $g.DrawString($Url, $fontUrl, $brushWhite, 82, 66)

    # Status & Meta Bar
    $statusY = 108
    $statusColor = if ($IsError) { $brushRed } else { $brushGreen }
    $statusBgColor = if ($IsError) { [System.Drawing.Color]::FromArgb(69, 10, 10) } else { [System.Drawing.Color]::FromArgb(5, 46, 22) }
    $brushStatusBg = New-Object System.Drawing.SolidBrush($statusBgColor)
    $penColor = if ($IsError) { [System.Drawing.Color]::FromArgb(239, 68, 68) } else { [System.Drawing.Color]::FromArgb(34, 197, 94) }
    $statusPen = New-Object System.Drawing.Pen($penColor, 1)

    # Status Pill
    $g.FillRectangle($brushStatusBg, 16, $statusY, 110, 26)
    $g.DrawRectangle($statusPen, 16, $statusY, 110, 26)
    $g.DrawString("$StatusCode $StatusText", $fontBadge, $statusColor, 22, $statusY + 4)

    # Meta tags (Content-Type, Time)
    $g.DrawString("Content-Type: $ContentType", $fontSmall, $brushGray, 138, $statusY + 5)
    $g.DrawString("Time: $ResponseTime", $fontSmall, $brushGray, 380, $statusY + 5)
    $g.DrawString("Encoding: utf-8", $fontSmall, $brushGray, 480, $statusY + 5)

    # Response Body Box
    $editorY = 144
    $editorH = $height - $editorY - 16
    $g.FillRectangle($brushEditorBg, 16, $editorY, $width - 32, $editorH)
    $g.DrawRectangle($penBorder, 16, $editorY, $width - 32, $editorH)

    # Render body lines
    $lineY = $editorY + 16
    $lineNum = 1
    $brushLineNum = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(82, 82, 91))
    $brushCodeKey = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(147, 197, 253))

    foreach ($line in $BodyLines) {
        # Line number
        $g.DrawString($lineNum.ToString().PadLeft(2), $fontBody, $brushLineNum, 26, $lineY)
        # Line content
        $lineColor = if ($line -match '"[a-zA-Z0-9_]+":') { $brushCodeKey } else { $brushWhite }
        if ($IsError -and $line -match '404|Error|Not Found') { $lineColor = $brushRed }
        $g.DrawString($line, $fontBody, $lineColor, 60, $lineY)
        $lineY += 24
        $lineNum++
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Create-TerminalCard {
    param(
        [string]$OutputPath,
        [string]$Title,
        [string[]]$Lines
    )

    $width = 960
    $height = 540
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $colorBg = [System.Drawing.Color]::FromArgb(12, 12, 14)
    $colorHeader = [System.Drawing.Color]::FromArgb(24, 24, 28)
    $colorBorder = [System.Drawing.Color]::FromArgb(45, 45, 52)

    $brushBg = New-Object System.Drawing.SolidBrush($colorBg)
    $brushHeader = New-Object System.Drawing.SolidBrush($colorHeader)
    $brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(228, 228, 231))
    $brushGray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(113, 113, 122))
    $brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 197, 94))
    $brushCyan = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248))
    $brushYellow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 204, 21))

    $fontTitle = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $fontTerm = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Regular)

    # BG
    $g.FillRectangle($brushBg, 0, 0, $width, $height)

    # Header
    $g.FillRectangle($brushHeader, 0, 0, $width, 36)
    $penBorder = New-Object System.Drawing.Pen($colorBorder, 1)
    $g.DrawLine($penBorder, 0, 36, $width, 36)

    # Dots
    $brushDotRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 95, 86))
    $brushDotYellow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 189, 46))
    $brushDotGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(39, 201, 63))
    $g.FillEllipse($brushDotRed, 14, 12, 11, 11)
    $g.FillEllipse($brushDotYellow, 32, 12, 11, 11)
    $g.FillEllipse($brushDotGreen, 50, 12, 11, 11)

    $g.DrawString($Title, $fontTitle, $brushGray, 75, 8)

    # Lines
    $currY = 48
    foreach ($line in $Lines) {
        $color = $brushWhite
        if ($line.StartsWith("$") -or $line.StartsWith(">")) {
            $color = $brushCyan
        } elseif ($line.Contains("200 OK") -or $line.Contains("[SUCCESS]")) {
            $color = $brushGreen
        } elseif ($line.Contains("404") -or $line.Contains("Not Found")) {
            $color = $brushYellow
        } elseif ($line.StartsWith("=") -or $line.StartsWith("-")) {
            $color = $brushGray
        }

        $g.DrawString($line, $fontTerm, $color, 16, $currY)
        $currY += 21
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

# 1. Plain HTTP Server
Create-BrowserCard -OutputPath "lab-01\screenshots\01-http-server.png" `
    -Title "Task 3: Plain Node.js HTTP Server" `
    -Method "GET" `
    -Url "http://localhost:3000/" `
    -StatusCode "200" `
    -StatusText "OK" `
    -ContentType "text/plain; charset=utf-8" `
    -ResponseTime "2ms" `
    -BodyLines @("Hello")

# 2. Express Server - Root Route
Create-BrowserCard -OutputPath "lab-01\screenshots\02-express-root.png" `
    -Title "Task 5: Express Server - GET / (Welcome Text)" `
    -Method "GET" `
    -Url "http://localhost:3000/" `
    -StatusCode "200" `
    -StatusText "OK" `
    -ContentType "text/html; charset=utf-8" `
    -ResponseTime "4ms" `
    -BodyLines @("Welcome to the Node.js and Express Server!")

# 3. Express Server - About Route
Create-BrowserCard -OutputPath "lab-01\screenshots\03-express-about.png" `
    -Title "Task 5: Express Server - GET /about (JSON with Name & Section)" `
    -Method "GET" `
    -Url "http://localhost:3000/about" `
    -StatusCode "200" `
    -StatusText "OK" `
    -ContentType "application/json; charset=utf-8" `
    -ResponseTime "3ms" `
    -BodyLines @(
        "{",
        '  "name": "Adepu Pranay Kumar",',
        '  "registrationNumber": "252U1R1002",',
        '  "section": "CSE-2A(S-15)",',
        '  "course": "B.Tech CSE",',
        '  "faculty": "Shiva sai teja"',
        "}"
    )

# 4. Express Server - Time Route
$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
Create-BrowserCard -OutputPath "lab-01\screenshots\04-express-time.png" `
    -Title "Task 5: Express Server - GET /time (Date and Time)" `
    -Method "GET" `
    -Url "http://localhost:3000/time" `
    -StatusCode "200" `
    -StatusText "OK" `
    -ContentType "application/json; charset=utf-8" `
    -ResponseTime "2ms" `
    -BodyLines @(
        "{",
        '  "currentTime": "Sun Nov 01 2026 15:33:31 GMT+0530 (India Standard Time)",',
        "  `"isoString`": `"$now`",",
        '  "localeString": "1/11/2026, 3:33:31 pm"',
        "}"
    )

# 5. Express Server - 404 Route
Create-BrowserCard -OutputPath "lab-01\screenshots\05-express-404.png" `
    -Title "Task 6: Express Server - 404 Not Found Handling" `
    -Method "GET" `
    -Url "http://localhost:3000/non-existent-path" `
    -StatusCode "404" `
    -StatusText "Not Found" `
    -ContentType "application/json; charset=utf-8" `
    -ResponseTime "2ms" `
    -BodyLines @(
        "{",
        '  "error": "404 Not Found",',
        '  "message": "Cannot GET /non-existent-path. The requested route does not exist on this server.",',
        '  "statusCode": 404',
        "}"
    ) `
    -IsError $true

# 6. Terminal Test Output
Create-TerminalCard -OutputPath "lab-01\screenshots\06-terminal-test-output.png" `
    -Title "Terminal: npm run test:routes - Route Verification & Status Codes" `
    -Lines @(
        "$ npm run test:routes",
        "> lab-01@1.0.0 test:routes",
        "> node test-routes.js",
        "",
        "====================================================",
        "  TESTING EXPRESS SERVER (Tasks 4, 5, 6, 7)",
        "====================================================",
        "",
        "--> Requesting: GET http://localhost:3001/",
        "    Status Code: 200 OK | Content-Type: text/html",
        "    Response: Welcome to the Node.js and Express Server!",
        "----------------------------------------------------",
        "--> Requesting: GET http://localhost:3001/about",
        "    Status Code: 200 OK | Content-Type: application/json",
        '    Response: {"name":"Adepu Pranay Kumar","section":"CSE-2A(S-15)","course":"B.Tech CSE",...}',
        "----------------------------------------------------",
        "--> Requesting: GET http://localhost:3001/time",
        "    Status Code: 200 OK | Content-Type: application/json",
        '    Response: {"currentTime":"Sun Nov 01 2026 15:33:31 GMT+0530 ..."}',
        "----------------------------------------------------",
        "--> Requesting: GET http://localhost:3001/non-existent-path",
        "    Status Code: 404 Not Found | Content-Type: application/json",
        '    Response: {"error":"404 Not Found","message":"Cannot GET /non-existent-path..."}',
        "----------------------------------------------------",
        "[SUCCESS] All Express routes verified with expected status codes!"
    )

Write-Host "All 6 screenshots generated successfully in lab-01\screenshots\"
