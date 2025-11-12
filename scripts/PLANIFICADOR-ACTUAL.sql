-- MySQL dump 10.13  Distrib 8.0.44, for macos26.0 (arm64)
--
-- Host: localhost    Database: planificador
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `articulo_local`
--

DROP TABLE IF EXISTS `articulo_local`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articulo_local` (
  `CODIGO_BARRA` varchar(50) DEFAULT NULL,
  `COD_INTERNO` int NOT NULL,
  `PRECIO_SIN_IVA` decimal(10,2) DEFAULT NULL,
  `COSTO` decimal(10,2) DEFAULT NULL,
  `GANANCIA` decimal(10,2) DEFAULT NULL,
  `PRECIO` decimal(10,2) DEFAULT NULL,
  `ART_DESC_VTA` varchar(255) DEFAULT NULL,
  `COD_DPTO` int DEFAULT NULL,
  `COD_RUBRO` int DEFAULT NULL,
  `COD_SUBRUBRO` int DEFAULT NULL,
  PRIMARY KEY (`COD_INTERNO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clasif_local`
--

DROP TABLE IF EXISTS `clasif_local`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clasif_local` (
  `NOM_CLASIF` varchar(255) DEFAULT NULL,
  `ID_CLASIF` int NOT NULL,
  `DAT_CLASIF` int DEFAULT NULL,
  PRIMARY KEY (`ID_CLASIF`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `controlhs_2023`
--

DROP TABLE IF EXISTS `controlhs_2023`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controlhs_2023` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `hora_ingreso` time DEFAULT NULL,
  `hora_egreso` time DEFAULT NULL,
  `horas_trabajadas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `controlhs_2024`
--

DROP TABLE IF EXISTS `controlhs_2024`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controlhs_2024` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `hora_ingreso` time DEFAULT NULL,
  `hora_egreso` time DEFAULT NULL,
  `horas_trabajadas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `controlhs_2025`
--

DROP TABLE IF EXISTS `controlhs_2025`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controlhs_2025` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `hora_ingreso` time DEFAULT NULL,
  `hora_egreso` time DEFAULT NULL,
  `horas_trabajadas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `controlhs_2026`
--

DROP TABLE IF EXISTS `controlhs_2026`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controlhs_2026` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `hora_ingreso` time DEFAULT NULL,
  `hora_egreso` time DEFAULT NULL,
  `horas_trabajadas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `controlhs_2027`
--

DROP TABLE IF EXISTS `controlhs_2027`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controlhs_2027` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `hora_ingreso` time DEFAULT NULL,
  `hora_egreso` time DEFAULT NULL,
  `horas_trabajadas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `apellido` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `mail` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `fecha_ingreso` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `antiguedad` int NOT NULL,
  `hora_normal` int NOT NULL,
  `foto_perfil` longblob,
  `huella_dactilar` longblob,
  `dia_vacaciones` int NOT NULL,
  `horas_vacaciones` int DEFAULT NULL,
  `foto_perfil_url` varchar(255) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ev_cont_hist_local`
--

DROP TABLE IF EXISTS `ev_cont_hist_local`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ev_cont_hist_local` (
  `COD_INTERNO` int DEFAULT NULL,
  `COD_BARRA` varchar(50) DEFAULT NULL,
  `COD_DEPTO` int DEFAULT NULL,
  `COD_RUBRO` int DEFAULT NULL,
  `COD_SUBRUBRO` int DEFAULT NULL,
  `CANTIDAD` int DEFAULT NULL,
  `TOTAL` decimal(10,2) DEFAULT NULL,
  `IMPORTE_SIN_IVA` decimal(10,2) DEFAULT NULL,
  `IVA1` decimal(10,2) DEFAULT NULL,
  `COSTO` decimal(10,2) DEFAULT NULL,
  `GANANCIA` decimal(10,2) DEFAULT NULL,
  `FECHA_TICKET` date DEFAULT NULL,
  `NRO_TICKET` int DEFAULT NULL,
  `HORAS_REG` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `extras_2023`
--

DROP TABLE IF EXISTS `extras_2023`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extras_2023` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_empleado` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `monto` int NOT NULL,
  `descripcion` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `extras_2024`
--

DROP TABLE IF EXISTS `extras_2024`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extras_2024` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_empleado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `monto` int NOT NULL,
  `descripcion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `detalle` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_empleado_mes` (`nombre_empleado`,`mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `extras_2025`
--

DROP TABLE IF EXISTS `extras_2025`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extras_2025` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_empleado` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `monto` int NOT NULL,
  `descripcion` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `detalle` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `extras_2026`
--

DROP TABLE IF EXISTS `extras_2026`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extras_2026` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_empleado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `monto` int NOT NULL,
  `descripcion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `detalle` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_empleado_mes` (`nombre_empleado`,`mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `extras_2027`
--

DROP TABLE IF EXISTS `extras_2027`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extras_2027` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_empleado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `monto` int NOT NULL,
  `descripcion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `detalle` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_empleado_mes` (`nombre_empleado`,`mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feriados`
--

DROP TABLE IF EXISTS `feriados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feriados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `festejo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `dia` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `periodo` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `horarios`
--

DROP TABLE IF EXISTS `horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `turnos` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `horaInicio` int DEFAULT NULL,
  `horaFin` int DEFAULT NULL,
  `horas` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingresos_ganancias_temp`
--

DROP TABLE IF EXISTS `ingresos_ganancias_temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingresos_ganancias_temp` (
  `Fecha` date NOT NULL,
  `Ingresos` decimal(10,2) DEFAULT '0.00',
  `Ganancias` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`Fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logueo_2023`
--

DROP TABLE IF EXISTS `logueo_2023`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logueo_2023` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `huella_dactilar` longblob NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logueo_2024`
--

DROP TABLE IF EXISTS `logueo_2024`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logueo_2024` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `huella_dactilar` longblob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logueo_2025`
--

DROP TABLE IF EXISTS `logueo_2025`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logueo_2025` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `huella_dactilar` longblob,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logueo_2026`
--

DROP TABLE IF EXISTS `logueo_2026`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logueo_2026` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `huella_dactilar` longblob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logueo_2027`
--

DROP TABLE IF EXISTS `logueo_2027`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logueo_2027` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `huella_dactilar` longblob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recibos`
--

DROP TABLE IF EXISTS `recibos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recibos` (
  `empleado` varchar(255) NOT NULL,
  `mes` varchar(50) NOT NULL,
  `anio` int NOT NULL,
  `hsPlaniValor` int DEFAULT '0',
  `hsPlaniCantidad` int DEFAULT '0',
  `hsTrabajadasValor` int DEFAULT '0',
  `hsTrabajadasCantidad` int DEFAULT '0',
  `consumos` int DEFAULT '0',
  PRIMARY KEY (`empleado`,`mes`,`anio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `totales_2023`
--

DROP TABLE IF EXISTS `totales_2023`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `totales_2023` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=315 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `totales_2024`
--

DROP TABLE IF EXISTS `totales_2024`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `totales_2024` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=320 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `totales_2025`
--

DROP TABLE IF EXISTS `totales_2025`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `totales_2025` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `totales_2026`
--

DROP TABLE IF EXISTS `totales_2026`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `totales_2026` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mes` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `totales_2027`
--

DROP TABLE IF EXISTS `totales_2027`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `totales_2027` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `horas` int DEFAULT '0' COMMENT 'Total horas del mes',
  `acumulado` int DEFAULT '0' COMMENT 'Total dinero del mes',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_mes_empleado` (`mes`,`nombre_empleado`),
  KEY `idx_empleado` (`nombre_empleado`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos_2023`
--

DROP TABLE IF EXISTS `turnos_2023`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos_2023` (
  `turno_id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `turno` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`turno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9673 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos_2024`
--

DROP TABLE IF EXISTS `turnos_2024`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos_2024` (
  `turno_id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `turno` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`turno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9619 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos_2025`
--

DROP TABLE IF EXISTS `turnos_2025`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos_2025` (
  `turno_id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `turno` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`turno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6964 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos_2026`
--

DROP TABLE IF EXISTS `turnos_2026`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos_2026` (
  `turno_id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `turno` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `horas` int DEFAULT NULL,
  `acumulado` int DEFAULT NULL,
  PRIMARY KEY (`turno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11098 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos_2027`
--

DROP TABLE IF EXISTS `turnos_2027`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos_2027` (
  `turno_id` int NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Formato: DD/MM/YYYY',
  `nombre_empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `turno` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT 'Libre',
  `horas` int DEFAULT '0' COMMENT 'Horas trabajadas ese día',
  `acumulado` int DEFAULT '0' COMMENT 'Dinero ganado ese día',
  PRIMARY KEY (`turno_id`),
  KEY `idx_fecha_empleado` (`fecha`,`nombre_empleado`),
  KEY `idx_empleado` (`nombre_empleado`)
) ENGINE=InnoDB AUTO_INCREMENT=3286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `rol` enum('gerente','admin','empleado') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'empleado',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_sesion` datetime DEFAULT NULL,
  `empleado_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuario` (`usuario`),
  KEY `idx_email` (`email`),
  KEY `idx_activo` (`activo`),
  KEY `fk_empleado` (`empleado_id`),
  KEY `idx_usuario_activo` (`usuario`,`activo`),
  KEY `idx_rol` (`rol`),
  CONSTRAINT `fk_usuario_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vacaciones`
--

DROP TABLE IF EXISTS `vacaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_empleado` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `dias` int NOT NULL,
  `salida` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `regreso` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'planificador'
--
/*!50003 DROP PROCEDURE IF EXISTS `crear_tablas_anio` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `crear_tablas_anio`(IN anio_param INT)
BEGIN
    SET @tabla_turnos = CONCAT('turnos_', anio_param);
    SET @tabla_totales = CONCAT('totales_', anio_param);
    SET @tabla_control = CONCAT('controlhs_', anio_param);
    SET @tabla_extras = CONCAT('extras_', anio_param);
    SET @tabla_logueo = CONCAT('logueo_', anio_param);
    
    
    SET @sql_turnos = CONCAT('CREATE TABLE IF NOT EXISTS ', @tabla_turnos, ' (
        turno_id INT NOT NULL AUTO_INCREMENT,
        fecha VARCHAR(50) NOT NULL COMMENT ''Formato: DD/MM/YYYY'',
        nombre_empleado VARCHAR(255) NOT NULL,
        turno VARCHAR(50) DEFAULT ''Libre'',
        horas INT DEFAULT 0 COMMENT ''Horas trabajadas ese día'',
        acumulado INT DEFAULT 0 COMMENT ''Dinero ganado ese día'',
        PRIMARY KEY (turno_id),
        KEY idx_fecha_empleado (fecha, nombre_empleado),
        KEY idx_empleado (nombre_empleado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;');
    
    PREPARE stmt FROM @sql_turnos;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    
    SET @sql_totales = CONCAT('CREATE TABLE IF NOT EXISTS ', @tabla_totales, ' (
        id INT NOT NULL AUTO_INCREMENT,
        mes VARCHAR(50) NOT NULL,
        nombre_empleado VARCHAR(255) NOT NULL,
        horas INT DEFAULT 0 COMMENT ''Total horas del mes'',
        acumulado INT DEFAULT 0 COMMENT ''Total dinero del mes'',
        PRIMARY KEY (id),
        UNIQUE KEY idx_mes_empleado (mes, nombre_empleado),
        KEY idx_empleado (nombre_empleado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;');
    
    PREPARE stmt FROM @sql_totales;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    
    SET @sql_control = CONCAT('CREATE TABLE IF NOT EXISTS ', @tabla_control, ' (
        id INT NOT NULL AUTO_INCREMENT,
        fecha VARCHAR(50) DEFAULT NULL,
        nombre_empleado VARCHAR(255) NOT NULL,
        hora_ingreso TIME DEFAULT NULL,
        hora_egreso TIME DEFAULT NULL,
        horas_trabajadas INT DEFAULT NULL,
        acumulado INT DEFAULT NULL,
        mes VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_fecha_empleado (fecha, nombre_empleado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;');
    
    PREPARE stmt FROM @sql_control;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    
    SET @sql_extras = CONCAT('CREATE TABLE IF NOT EXISTS ', @tabla_extras, ' (
        id INT NOT NULL AUTO_INCREMENT,
        nombre_empleado VARCHAR(50) NOT NULL,
        mes VARCHAR(50) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        monto INT NOT NULL,
        descripcion VARCHAR(50) NOT NULL,
        detalle INT NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        KEY idx_empleado_mes (nombre_empleado, mes)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;');
    
    PREPARE stmt FROM @sql_extras;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    
    SET @sql_logueo = CONCAT('CREATE TABLE IF NOT EXISTS ', @tabla_logueo, ' (
        id INT NOT NULL AUTO_INCREMENT,
        fecha VARCHAR(50) DEFAULT NULL,
        nombre_empleado VARCHAR(255) NOT NULL,
        accion VARCHAR(50) DEFAULT NULL,
        hora TIME DEFAULT NULL,
        mes VARCHAR(50) NOT NULL,
        huella_dactilar LONGBLOB NOT NULL,
        PRIMARY KEY (id),
        KEY idx_fecha_empleado (fecha, nombre_empleado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;');
    
    PREPARE stmt FROM @sql_logueo;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SELECT CONCAT('✅ Tablas creadas para el año ', anio_param) AS resultado;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `generar_turnos_empleado` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `generar_turnos_empleado`(
    IN nombre_empleado VARCHAR(255),
    IN anio_inicio INT,
    IN anio_fin INT
)
BEGIN
    DECLARE anio_actual INT;
    DECLARE mes_actual INT;
    DECLARE dias_mes INT;
    DECLARE dia_actual INT;
    DECLARE fecha_completa VARCHAR(50);
    
    SET anio_actual = anio_inicio;
    
    
    WHILE anio_actual <= anio_fin DO
        SET @tabla_turnos = CONCAT('turnos_', anio_actual);
        SET @tabla_totales = CONCAT('totales_', anio_actual);
        
        
        SET mes_actual = 1;
        WHILE mes_actual <= 12 DO
            
            
            SET dias_mes = CASE mes_actual
                WHEN 1 THEN 31  
                WHEN 2 THEN IF(anio_actual % 4 = 0 AND (anio_actual % 100 != 0 OR anio_actual % 400 = 0), 29, 28)  
                WHEN 3 THEN 31  
                WHEN 4 THEN 30  
                WHEN 5 THEN 31  
                WHEN 6 THEN 30  
                WHEN 7 THEN 31  
                WHEN 8 THEN 31  
                WHEN 9 THEN 30  
                WHEN 10 THEN 31 
                WHEN 11 THEN 30 
                WHEN 12 THEN 31 
            END;
            
            
            SET dia_actual = 1;
            WHILE dia_actual <= dias_mes DO
                
                SET fecha_completa = CONCAT(
                    LPAD(dia_actual, 2, '0'), '/',
                    LPAD(mes_actual, 2, '0'), '/',
                    anio_actual
                );
                
                
                SET @sql_insert = CONCAT(
                    'INSERT IGNORE INTO ', @tabla_turnos,
                    ' (fecha, nombre_empleado, turno, horas, acumulado) VALUES (?, ?, ''Libre'', 0, 0)'
                );
                
                PREPARE stmt FROM @sql_insert;
                SET @fecha = fecha_completa;
                SET @nombre = nombre_empleado;
                EXECUTE stmt USING @fecha, @nombre;
                DEALLOCATE PREPARE stmt;
                
                SET dia_actual = dia_actual + 1;
            END WHILE;
            
            
            SET @sql_totales = CONCAT(
                'INSERT IGNORE INTO ', @tabla_totales,
                ' (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, 0, 0)'
            );
            
            PREPARE stmt FROM @sql_totales;
            SET @mes = mes_actual;
            SET @nombre = nombre_empleado;
            EXECUTE stmt USING @mes, @nombre;
            DEALLOCATE PREPARE stmt;
            
            SET mes_actual = mes_actual + 1;
        END WHILE;
        
        SET anio_actual = anio_actual + 1;
    END WHILE;
    
    SELECT CONCAT('✅ Turnos generados para ', nombre_empleado, ' desde ', anio_inicio, ' hasta ', anio_fin) AS resultado;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-12 17:30:43
