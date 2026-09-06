<?php
/**
 * Mi App Financiera - Standalone PHP Index Portal
 * Denne filen kan lastes opp direkte til enhver PHP-server (cPanel/Apache/Nginx).
 */

$appName = "FinansApp Pro - Aksjetips & Scanner";
$today = date("d.m.Y H:i");

// Eksempel på aksjesignaler beregnet i PHP
$stockTips = [
    ["symbol" => "MSFT", "company" => "Microsoft Corp.", "price" => 420.50, "action" => "COMPRAR", "confidence" => 85, "rsi" => 28],
    ["symbol" => "AAPL", "company" => "Apple Inc.", "price" => 187.32, "action" => "OBSERVAR", "confidence" => 62, "rsi" => 51],
    ["symbol" => "NVDA", "company" => "NVIDIA Corp.", "price" => 875.10, "action" => "COMPRAR", "confidence" => 90, "rsi" => 24],
    ["symbol" => "TSLA", "company" => "Tesla Inc.", "price" => 175.40, "action" => "VENDER", "confidence" => 30, "rsi" => 76],
    ["symbol" => "BTC-USD", "company" => "Bitcoin", "price" => 64200.00, "action" => "COMPRAR", "confidence" => 88, "rsi" => 26],
];
?>
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $appName; ?></title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #131722; color: #d1d4dc; padding: 20px; line-height: 1.6; }
        .container { max-width: 1100px; margin: 0 auto; }
        header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #2a2e39; margin-bottom: 30px; }
        h1 { color: #00c897; font-size: 26px; }
        .badge { background: #2962ff; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #1e222d; padding: 20px; border-radius: 10px; border: 1px solid #2a2e39; }
        .card h3 { font-size: 16px; color: #888; margin-bottom: 10px; }
        .price { font-size: 28px; font-weight: bold; color: #fff; }
        .table-box { background: #1e222d; padding: 20px; border-radius: 10px; border: 1px solid #2a2e39; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 12px; border-bottom: 1px solid #2a2e39; }
        th { color: #888; font-size: 13px; text-transform: uppercase; }
        .buy { color: #00c897; font-weight: bold; background: rgba(0,200,151,0.1); padding: 4px 10px; border-radius: 4px; }
        .sell { color: #f23645; font-weight: bold; background: rgba(242,54,69,0.1); padding: 4px 10px; border-radius: 4px; }
        .hold { color: #f0b90b; font-weight: bold; background: rgba(240,185,11,0.1); padding: 4px 10px; border-radius: 4px; }
        footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>📈 <?php echo $appName; ?></h1>
                <p style="color: #888; font-size: 13px;">Kjører på PHP Server | Oppdatert: <?php echo $today; ?></p>
            </div>
            <span class="badge">PHP Standalone v1.0</span>
        </header>

        <div class="card-grid">
            <div class="card">
                <h3>Markedsstatus</h3>
                <div class="price" style="color: #00c897;">ÅPEN 🟢</div>
                <p style="font-size: 12px; color: #888; margin-top: 5px;">Reeltids-signaler aktive</p>
            </div>
            <div class="card">
                <h3>Top Aksjetips</h3>
                <div class="price">NVDA ($875.10)</div>
                <p style="font-size: 12px; color: #00c897; margin-top: 5px;">Sterkt Kjøpssignal (90% tillit)</p>
            </div>
            <div class="card">
                <h3>Skannede Aksjer</h3>
                <div class="price"><?php echo count($stockTips); ?> Aktive</div>
                <p style="font-size: 12px; color: #888; margin-top: 5px;">Basert på RSI & SMA7 algoritme</p>
            </div>
        </div>

        <div class="table-box">
            <h2 style="font-size: 20px; margin-bottom: 15px; color: #fff;">📊 Siste Aksjesignaler & Tips</h2>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Selskap</th>
                        <th>Pris</th>
                        <th>RSI (14)</th>
                        <th>Tillit</th>
                        <th>Anbefalt Handling</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($stockTips as $tip): ?>
                        <tr>
                            <td style="font-weight: bold; color: #fff;"><?php echo $tip['symbol']; ?></td>
                            <td><?php echo $tip['company']; ?></td>
                            <td>$<?php echo number_format($tip['price'], 2); ?></td>
                            <td><?php echo $tip['rsi']; ?></td>
                            <td><?php echo $tip['confidence']; ?>%</td>
                            <td>
                                <?php if ($tip['action'] === 'COMPRAR'): ?>
                                    <span class="buy">🟢 KJØP</span>
                                <?php elseif ($tip['action'] === 'VENDER'): ?>
                                    <span class="sell">🔴 SELG</span>
                                <?php else: ?>
                                    <span class="hold">🟡 OBSERVER</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <footer>
            <p>⚠️ Dette er en automatisk generert PHP-side for finansielle aksjesignaler. Ikke finansielt råd.</p>
        </footer>
    </div>
</body>
</html>
