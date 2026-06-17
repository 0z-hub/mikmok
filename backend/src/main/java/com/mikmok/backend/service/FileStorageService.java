package com.mikmok.backend.service;

import java.io.InputStream;

public interface FileStorageService {
    String upload(String objectName, InputStream inputStream, String contentType);
    void delete(String objectName);
}
