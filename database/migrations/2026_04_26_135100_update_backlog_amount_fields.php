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
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->renameColumn('emi_amount', 'installment_amount');
            $table->integer('interval')->default(1)->after('total_months');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->renameColumn('installment_amount', 'emi_amount');
            $table->dropColumn('interval');
        });
    }
};
