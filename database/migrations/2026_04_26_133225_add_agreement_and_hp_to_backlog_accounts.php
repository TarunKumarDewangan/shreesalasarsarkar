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
            $table->decimal('agreement_amount', 12, 2)->nullable()->after('finance_amount');
            $table->decimal('hp_amount', 12, 2)->nullable()->after('agreement_amount');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->dropColumn(['agreement_amount', 'hp_amount']);
        });
    }
};
