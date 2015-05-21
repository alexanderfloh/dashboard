package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.Date
import play.Logger
import models.NevergreenResult
import scala.util.parsing.json.JSONArray
import scala.util.Try
object JenkinsFetcher {

  def getDetails(json: JsValue, numberOfItems: Integer, baseUrl: String): Future[List[JsObject]] = {

    val buildsJson = (json \ "builds").as[List[JsValue]]
    val builds = buildsJson.map(build => (build \ "number").as[Int]).reverse.takeRight(numberOfItems)
    Future.sequence(builds.map(build => {
      fetchBuild(baseUrl, build)
    }))
  }

  // fetch ci build with tests
  def fetchCI(baseUrl: String, mapName: String, numberOfItems: Integer): Future[String] = {
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = getDetails(json, numberOfItems, baseUrl)
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]

      val urlRegression1 = Play.current.configuration.getString("dashboard.urlRegressionsTrunk")
        .getOrElse(throw new RuntimeException("dashboard.urlRegressionsTrunk not configured"))
      val regressionName1 = Play.current.configuration.getString("dashboard.regressionNameTrunk")
        .getOrElse(throw new RuntimeException("dashboard.regressionNameTrunk not configured"))

      for {
        regression1 <- fetchTests(urlRegression1, regressionName1)
        lastCompletedDetails <- details
        lastBuildDetails <- fetchLastBuild(baseUrl, lastBuild)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal +
            (("regression1", regression1.getOrElse(buildNumber, Json.toJson(""))))
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests, "lastBuild" -> lastBuildDetails))
      }
    }
  }

  // fetch nightly build with nevergreen list
  def fetchNightly(baseUrl: String, mapName: String, numberOfItems: Integer): Future[String] = {
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      
      val json = Json.parse(response.body)
      val details = getDetails(json, numberOfItems, baseUrl)

      val urlRegression1 = Play.current.configuration.getString("dashboard.urlRegressions1")
        .getOrElse(throw new RuntimeException("dashboard.urlRegressions1 not configured"))
      val regressionName1 = Play.current.configuration.getString("dashboard.regressionNameBuildAll1")
        .getOrElse(throw new RuntimeException("dashboard.regressionNameBuildAll1 not configured"))

      val urlRegression2 = Play.current.configuration.getString("dashboard.urlRegressions2")
        .getOrElse(throw new RuntimeException("dashboard.urlRegressions2 not configured"))
      val regressionName2 = Play.current.configuration.getString("dashboard.regressionNameBuildAll2")
        .getOrElse(throw new RuntimeException("dashboard.regressionNameBuildAll2 not configured"))

      val urlRegression3 = Play.current.configuration.getString("dashboard.urlRegressions3")
        .getOrElse(throw new RuntimeException("dashboard.urlRegressions3 not configured"))
      val regressionName3 = Play.current.configuration.getString("dashboard.regressionNameBuildAll3")
        .getOrElse(throw new RuntimeException("dashboard.regressionNameBuildAll3 not configured"))

      val urlRegression4 = Play.current.configuration.getString("dashboard.urlRegressions4")
        .getOrElse(throw new RuntimeException("dashboard.urlRegressions4 not configured"))
      val regressionName4 = Play.current.configuration.getString("dashboard.regressionNameBuildAll4")
        .getOrElse(throw new RuntimeException("dashboard.regressionNameBuildAll4 not configured"))

      val urlRegression5 = Play.current.configuration.getString("dashboard.urlRegressions5")
        .getOrElse(throw new RuntimeException("dashboard.urlRegressions5 not configured"))
      val regressionName5 = Play.current.configuration.getString("dashboard.regressionNameBuildAll5")
        .getOrElse(throw new RuntimeException("dashboard.regressionNameBuildAll5 not configured"))

      for {
        lastCompletedDetails <- details
        regression1 <- fetchTests(urlRegression1, regressionName1)
        regression2 <- fetchTests(urlRegression2, regressionName2)
        regression3 <- fetchTests(urlRegression3, regressionName3)
        regression4 <- fetchTests(urlRegression4, regressionName4)
        regression5 <- fetchTests(urlRegression5, regressionName5)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal +
            (("regression1", regression1.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression2", regression2.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression3", regression3.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression4", regression4.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression5", regression5.getOrElse(buildNumber, Json.toJson(""))))
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests))
      }
    }
  }

  // helper
  def mapBuildStatus(status: Option[String]): String =
    status.map(s => s match {
      case "SUCCESS"  => "stable"
      case "FAILURE"  => "failed"
      case "ABORTED"  => "cancelled"
      case "UNSTABLE" => "unstable"
      case _          => s
    }).getOrElse("pending")

  def fetchBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,culprits[fullName],changeSet[items[author[id]]],actions[parameters[value]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)

      val authors = (json \ "changeSet" \ "items").asOpt[List[JsValue]].getOrElse(List())
      val ids = authors.map(_ \ "author").distinct
      var parameter = null : JsValue;
      parameter = Json.toJson(buildNumber)
      try{
        parameter = (((json \ "actions").as[Array[JsValue]].take(1).last \ "parameters").as[Array[JsValue]].take(1).last\"value")
      }catch{case e : Exception => }
      Json.obj(
        "status" -> mapBuildStatus((json \ "result").asOpt[String]),
        "number" -> buildNumber,
        "culprits" -> (json \ "culprits"),
        "authors" -> ids,
        "link" -> s"$baseUrl/$buildNumber",
        "DAILY_NUMBER" -> parameter)
    }
  }

  def fetchTests(baseUrl: String, testName: String): Future[Map[Int, JsValue]] = {
    WS.url(baseUrl + "/api/json?tree=builds[number,url]").get.flatMap { response =>
      val json = Json.parse(response.body)
      val buildsJson = (json \ "builds").as[List[JsValue]]
      val builds = buildsJson.map(build => (build \ "number").as[Int])
      val detailsF = Future.sequence(builds.map(build => {
        fetchTestDetails(baseUrl, build, testName)
      }))
      detailsF.map(details => {
        details.filter(_ != None)
          .map(d => d.get) // unwrap optionals
          .groupBy(_._1) // group by build
          .map { case (k, v) => (k, v.head._2) }
      })
    }
  }

  def fetchTestDetails(baseUrl: String, buildNumber: Int, testName: String): Future[Option[(Int, JsObject)]] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,actions[causes[upstreamBuild]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val triggeringBuild = (json \\ "upstreamBuild").headOption.map(_.as[Int])
      triggeringBuild.map(build =>
        (build, Json.obj("status" -> mapBuildStatus((json \ "result").asOpt[String]), "link" -> s"$baseUrl/$buildNumber", "name" -> testName)))
    }
  }

  def fetchLastBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json"
    WS.url(url).get.map { response =>
      val json = Json.parse(response.body)
      Json.obj(
        "buildNumber" -> buildNumber,
        "estimatedDuration" -> (json \ "estimatedDuration"),
        "timestamp" -> (json \ "timestamp"),
        "building" -> (json \ "building"))
    }
  }
}