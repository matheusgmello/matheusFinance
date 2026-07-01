package com.matheusfinance.shared.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

/**
 * Lê arquivos CSV ou XLSX e retorna todas as linhas como List<String[]>.
 * Detecta o formato pelo magic byte (PK = zip = xlsx).
 */
public class SpreadsheetReader {

    private SpreadsheetReader() {}

    public static List<String[]> read(byte[] bytes) throws Exception {
        return isXlsx(bytes) ? readXlsx(bytes) : readCsv(bytes);
    }

    public static boolean isXlsx(byte[] bytes) {
        return bytes.length >= 4
            && bytes[0] == 0x50 && bytes[1] == 0x4B  // PK (zip magic)
            && bytes[2] == 0x03 && bytes[3] == 0x04;
    }

    private static List<String[]> readXlsx(byte[] bytes) throws Exception {
        List<String[]> rows = new ArrayList<>();
        try (var wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();
            for (Row row : sheet) {
                int last = row.getLastCellNum();
                if (last <= 0) continue;
                String[] cols = new String[last];
                for (int i = 0; i < last; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    cols[i] = cell == null ? "" : fmt.formatCellValue(cell).trim();
                }
                rows.add(cols);
            }
        }
        return rows;
    }

    private static List<String[]> readCsv(byte[] bytes) throws Exception {
        Charset charset = detectCharset(bytes);
        List<String[]> rows = new ArrayList<>();
        try (var reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), charset))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.stripLeading();
                if (trimmed.startsWith("﻿")) trimmed = trimmed.substring(1);
                if (!trimmed.isBlank()) rows.add(trimmed.split(";", -1));
            }
        }
        return rows;
    }

    private static Charset detectCharset(byte[] bytes) {
        for (int i = 0; i < Math.min(bytes.length - 1, 512); i++) {
            if ((bytes[i] & 0xFF) == 0xC3 && (bytes[i + 1] & 0xFF) >= 0x80) {
                return java.nio.charset.StandardCharsets.UTF_8;
            }
        }
        return Charset.forName("ISO-8859-1");
    }
}
