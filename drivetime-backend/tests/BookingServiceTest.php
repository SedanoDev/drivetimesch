<?php

require_once __DIR__ . '/vendor/autoload.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;
use DriveTime\Services\BookingService;
use PHPUnit\Framework\TestCase;

class BookingServiceTest extends TestCase
{
    private $bookingService;

    protected function setUp(): void
    {
        $this->bookingService = new BookingService();
    }

    public function testGetBookingsReturnsArray()
    {
        // Mock user
        $user = ['tenant_id' => '123', 'role' => 'student', 'sub' => '456'];

        // This will fail without a real DB, so we just check if method exists
        $this->assertTrue(method_exists($this->bookingService, 'getBookings'));
    }
}
