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
            $table->decimal('emi_amount', 12, 2)->nullable()->after('interest_rate');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->dropColumn('emi_amount');
        });
    }
};
