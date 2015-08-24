name := "dashboard"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  filters,
  ws,
  "org.webjars" % "requirejs" % "2.1.14-1",
  "org.webjars" % "jquery" % "2.1.1",
  "org.webjars" % "jquery-ui" % "1.11.0",
  "org.webjars" % "jquery-file-upload" % "9.5.7",
  "org.webjars" % "react" % "0.13.3",
  "org.webjars" % "momentjs" % "2.8.1-1",
  "org.webjars" % "c3" % "0.4.9-1"
)     

lazy val root = (project in file(".")).enablePlugins(PlayScala).enablePlugins(SbtWeb)

includeFilter in (Assets, LessKeys.less) := "*.less"

pipelineStages := Seq(rjs, digest, gzip)

//RjsKeys.modules := Seq(
//    WebJs.JS.Object("name" -> "mainIndex"),
//    WebJs.JS.Object("name" -> "mainDetails"),
//    WebJs.JS.Object("name" -> "mainBucket")
//)

fork in run := true