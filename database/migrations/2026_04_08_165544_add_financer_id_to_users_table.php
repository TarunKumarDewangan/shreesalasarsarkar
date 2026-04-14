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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('financer_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');
            // Update enum by using a raw statement if needed, or just let it be handled by app logic
            // But we can add it here if we want to be explicit. SQLite/MySQL differences exist.
        });
        
        // Use raw query to update enum if MySQL
        if (config('database.default') === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'financer', 'staff') NOT NULL DEFAULT 'financer'");
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['financer_id']);
            $table->dropColumn('financer_id');
        });
        
        if (config('database.default') === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'financer') NOT NULL DEFAULT 'financer'");
        }
    }
};
