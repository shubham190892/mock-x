CREATE TABLE `res_hub` (
  `routeId` int NOT NULL,
  `reqKey` varchar(256) NOT NULL,
  `type` varchar(128) NOT NULL,
  `content` text,
  `ttl` int NOT NULL DEFAULT '-1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`routeId`,`reqKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;