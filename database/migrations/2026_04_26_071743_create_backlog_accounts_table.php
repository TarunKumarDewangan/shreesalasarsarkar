<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backlog_accounts', function (Blueprint $table) {
            $table->id();
            $table->integer('sno')->nullable();
            $table->integer('fno')->nullable();
            $table->integer('pno')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('father_name')->nullable();
            $table->string('cbcode')->nullable();
            $table->integer('total_months')->nullable();
            $table->decimal('finance_amount', 12, 2)->nullable();
            $table->decimal('interest_amount', 12, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->decimal('interest_rate', 10, 2)->nullable();
            $table->string('type')->comment('P or F')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backlog_accounts');
    }
};
