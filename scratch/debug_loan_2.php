<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Loan;

$loan = Loan::withTrashed()->find(2);
if ($loan) {
    echo "Deleted At: ";
    var_dump($loan->deleted_at);
}
 else {
    echo 'Loan not found';
}
