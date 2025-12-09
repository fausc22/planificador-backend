#!/bin/bash
# Script para instalar dependencias de Puppeteer en VPS Linux

echo "════════════════════════════════════════════════"
echo "  🔧 INSTALADOR DE DEPENDENCIAS DE PUPPETEER"
echo "════════════════════════════════════════════════"
echo ""

# Verificar si tiene permisos de sudo
if ! sudo -n true 2>/dev/null; then
    echo "❌ Este script requiere permisos de sudo"
    echo "   Ejecuta: sudo ./install-puppeteer-deps.sh"
    exit 1
fi

# Detectar distribución
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    echo "📦 Distribución detectada: Debian/Ubuntu"
elif [ -f /etc/redhat-release ]; then
    DISTRO="redhat"
    echo "📦 Distribución detectada: CentOS/RHEL"
else
    echo "❌ Distribución no soportada"
    echo "   Este script solo funciona en Debian/Ubuntu o CentOS/RHEL"
    exit 1
fi

echo ""
echo "ℹ️  Este script instalará las dependencias necesarias para Puppeteer"
echo "   Esto incluye: Chrome/Chromium y librerías del sistema"
echo ""
read -p "¿Continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "❌ Instalación cancelada"
    exit 0
fi

echo ""
echo "🔄 Actualizando repositorios..."

if [ "$DISTRO" = "debian" ]; then
    sudo apt-get update
    
    echo ""
    echo "📦 Instalando dependencias de Chrome/Chromium..."
    
    sudo apt-get install -y \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencias instaladas correctamente"
    else
        echo "❌ Error instalando dependencias"
        exit 1
    fi
    
elif [ "$DISTRO" = "redhat" ]; then
    sudo yum update -y
    
    echo ""
    echo "📦 Instalando dependencias de Chrome/Chromium..."
    
    sudo yum install -y \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencias instaladas correctamente"
    else
        echo "❌ Error instalando dependencias"
        exit 1
    fi
fi

echo ""
echo "🔍 Verificando instalación..."

# Verificar librerías críticas
if ldconfig -p | grep -q libnspr4; then
    echo "✅ libnspr4 instalada"
else
    echo "❌ libnspr4 NO encontrada"
fi

if ldconfig -p | grep -q libnss3; then
    echo "✅ libnss3 instalada"
else
    echo "❌ libnss3 NO encontrada"
fi

if ldconfig -p | grep -q libgbm; then
    echo "✅ libgbm instalada"
else
    echo "❌ libgbm NO encontrada"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ INSTALACIÓN COMPLETADA"
echo "════════════════════════════════════════════════"
echo ""
echo "🔄 Reinicia tu aplicación:"
echo "   pm2 restart tienda-api"
echo ""
echo "🧪 Prueba Puppeteer:"
echo "   cd /home/mycarrito.com.ar/backend"
echo "   node -e \"require('puppeteer').launch({headless:'new',args:['--no-sandbox']}).then(b=>{console.log('✅ OK');b.close()}).catch(e=>console.error('❌',e.message))\""
echo ""

