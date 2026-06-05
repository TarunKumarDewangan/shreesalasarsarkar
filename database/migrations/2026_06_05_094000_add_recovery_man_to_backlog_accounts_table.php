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
            $table->foreignId('recovery_man_id')->nullable()->after('cbcode')->constrained('users')->nullOnDelete();
            $table->date('collection_date')->nullable()->after('recovery_man_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->dropForeign(['recovery_man_id']);
            $table->dropColumn(['recovery_man_id', 'collection_date']);
        });
    }
};
