CREATE TABLE `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service` varchar(128) NOT NULL,
  `method` varchar(16) NOT NULL,
  `accept` varchar(128) NOT NULL DEFAULT 'application/json',
  `path` varchar(256) NOT NULL,
  `reqKeyParams` varchar(1024) DEFAULT NULL,
  `defaultTtL` int NOT NULL DEFAULT '-1',
  `defaultHost` varchar(256) DEFAULT NULL,
  `createAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_service_method_path` (`service`,`method`,`path`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;