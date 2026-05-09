<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use App\Models\BacklogAccount;
use App\Http\Controllers\Api\BacklogController;

$id = 10748; 
echo "Testing Backlog Profile ID: $id\n";

try {
    $account = BacklogAccount::with('installments')->find($id);
    if (!$account) {
        die("Account not found\n");
    }
    echo "Account Name: " . $account->name . "\n";
    
    $controller = new BacklogController();
    $response = $controller->show($id);
    echo "Response Code: " . $response->status() . "\n";
    echo "JSON Data: " . substr($response->getContent(), 0, 200) . "...\n";
    
} catch (\Exception $e) {
    echo "CRASH DETECTED!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " (Line: " . $e->getLine() . ")\n";
    echo "Trace: " . substr($e->getTraceAsString(), 0, 500) . "\n";
}
