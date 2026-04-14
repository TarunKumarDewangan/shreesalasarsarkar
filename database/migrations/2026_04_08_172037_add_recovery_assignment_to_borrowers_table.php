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
        Schema::table('borrowers', function (Blueprint $table) {
            $table->foreignId('recovery_man_id')->nullable()->after('financer_id')->constrained('users')->nullOnDelete();
            $table->string('collection_day', 20)->nullable()->after('zone'); // Mon, Tue, Wed, Thu, Fri, Sat, Sun, Daily, Monthly
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrowers', function (Blueprint $table) {
            //
        });
    }
};
