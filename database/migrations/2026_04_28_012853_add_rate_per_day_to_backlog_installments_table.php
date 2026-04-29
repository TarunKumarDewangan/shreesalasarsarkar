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
        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->integer('rate_per_day')->nullable()->after('coverage');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->dropColumn('rate_per_day');
        });
    }
};
