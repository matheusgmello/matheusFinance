package com.matheusfinance.shared.exception;

public class PerfilMismatchException extends RuntimeException {
    public PerfilMismatchException() {
        super("Resource does not belong to the active profile");
    }
}
