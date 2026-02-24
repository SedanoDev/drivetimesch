<?php
// Simple Email Helper (Mock)

function sendEmail($to, $subject, $body) {
    // In production, use PHPMailer or a real SMTP service.
    // For now, we just log to a file to simulate sending.
    $logFile = __DIR__ . '/../../email_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $message = "[$timestamp] TO: $to | SUBJECT: $subject | BODY: $body" . PHP_EOL;
    file_put_contents($logFile, $message, FILE_APPEND);
    return true;
}
