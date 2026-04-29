<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->string('cheque_no')->nullable()->after('mode');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->dropColumn('cheque_no');
        });
    }
};
