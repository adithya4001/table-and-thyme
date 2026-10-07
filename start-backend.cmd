@echo off
setlocal
if not defined JAVA_HOME if exist "C:\Program Files\Java\jdk-24\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-24"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0backend"
if not defined DB_USER set "DB_USER=tablethyme"
if not defined DB_PASSWORD set "DB_PASSWORD=tablethyme_local"
if exist target\table-and-thyme-1.0.0.jar (
  java -jar target\table-and-thyme-1.0.0.jar
) else (
  call mvn spring-boot:run
)
pause
