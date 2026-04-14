<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recoveries', function (Blueprint $row) {
            $row->id();
            $row->foreignId('financer_id')->constrained('users')->onDelete('cascade');
            $row->foreignId('staff_id')->constrained('users')->onDelete('cascade');
            $row->foreignId('borrower_id')->constrained('borrowers')->onDelete('cascade');
            $row->decimal('amount', 12, 2);
            $row->date('collection_date');
            $row->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $row->string('notes')->nullable();
            $row->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recoveries');
    }
};
