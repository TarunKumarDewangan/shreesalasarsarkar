<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = ['borrowers', 'loans', 'installments', 'recoveries', 'vehicles', 'guarantors'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->softDeletes();
            });
        }
    }

    public function down(): void
    {
        $tables = ['borrowers', 'loans', 'installments', 'recoveries', 'vehicles', 'guarantors'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropSoftDeletes();
            });
        }
    }
};
