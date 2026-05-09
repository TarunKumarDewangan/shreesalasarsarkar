<?php
use App\Models\BacklogAccount;
use App\Http\Controllers\Api\BacklogController;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(BacklogController::class);
$accounts = BacklogAccount::all();
foreach ($accounts as $a) {
    echo "Recalculating Account ID: {$a->id}\n";
    $controller->recalculateAll($a->id);
}
echo "Done!\n";
