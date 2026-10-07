FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/table-and-thyme-1.0.0.jar app.jar
ENV SERVER_ADDRESS=0.0.0.0
ENV JAVA_TOOL_OPTIONS="-Xms64m -Xmx256m"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
