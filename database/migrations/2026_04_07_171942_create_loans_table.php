<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrower_id')->constrained()->onDelete('cascade');
            $table->foreignId('financer_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['CASH', 'ONLINE'])->default('CASH');
            $table->date('agreement_date');
            $table->decimal('finance_amount', 12, 2)->default(0);
            $table->decimal('agreement_amount', 12, 2)->default(0);
            $table->decimal('hire_purchase_rto', 12, 2)->default(0);
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->integer('total_months')->default(12);
            $table->integer('interval')->default(1);
            $table->decimal('interest_rate', 5, 2)->default(0);
            $table->decimal('interest_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('installment_rate', 12, 2)->default(0);
            $table->enum('status', ['ACTIVE', 'CLOSED', 'SEIZED', 'FINAL'])->default('ACTIVE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
