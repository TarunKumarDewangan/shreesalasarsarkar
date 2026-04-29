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
            $table->string('zone')->nullable()->after('pno');
            $table->string('mobile')->nullable()->after('father_name');
            $table->text('address')->nullable()->after('mobile');
            $table->string('guarantor_name')->nullable()->after('address');
            $table->string('vehicle_model')->nullable()->after('guarantor_name');
            $table->string('vehicle_no')->nullable()->after('vehicle_model');
            $table->string('chassis_no')->nullable()->after('vehicle_no');
            $table->string('engine_no')->nullable()->after('chassis_no');
            $table->string('vehicle_make')->nullable()->after('engine_no');
            $table->string('vehicle_color')->nullable()->after('vehicle_make');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->dropColumn([
                'zone', 'mobile', 'address', 'guarantor_name', 
                'vehicle_model', 'vehicle_no', 'chassis_no', 
                'engine_no', 'vehicle_make', 'vehicle_color'
            ]);
        });
    }
};
