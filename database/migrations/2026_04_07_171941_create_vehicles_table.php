<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrower_id')->constrained()->onDelete('cascade');
            $table->enum('condition_type', ['NEW', 'USED'])->default('NEW');
            $table->string('sold_by')->nullable();
            $table->string('model')->nullable();
            $table->string('color')->nullable();
            $table->string('chassis_no')->nullable();
            $table->string('engine_no')->nullable();
            $table->year('make_year')->nullable();
            $table->string('vehicle_no')->nullable();
            $table->date('insurance_expiry')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
