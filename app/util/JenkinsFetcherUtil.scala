package util

import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global

object JenkinsFetcherUtil {

  def getDetails(json: JsValue, numberOfItems: Integer, baseUrl: String): Future[List[JsObject]] = {

    val buildsJson = (json \ "builds").as[List[JsValue]]
    val builds = buildsJson.map(build => (build \ "number").as[Int]).reverse.takeRight(numberOfItems)
    Future.sequence(builds.map(build => {
      fetchBuild(baseUrl, build)
    }))
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

  def fetchTests(baseUrl: String, testName: String): Future[(String, Map[Int, JsValue])] = {
    WS.url(baseUrl + "/api/json?tree=builds[number,url]").get.flatMap { response =>
      val json = Json.parse(response.body)
      val buildsJson = (json \ "builds").as[List[JsValue]]
      val builds = buildsJson.map(build => (build \ "number").as[Int])
      val detailsF = Future.sequence(builds.map(build => {
        fetchTestDetails(baseUrl, build, testName)
      }))
      detailsF.map(details => {
        val buildsToJson = details.flatten
          .groupBy { case (buildNumber, json) => buildNumber }
          .map { case (buildNumber, List((_, json))) => (buildNumber, json) }
        (testName, buildsToJson)
      })
    }
  }

  def fetchTestDetails(baseUrl: String, buildNumber: Int, testName: String): Future[Option[(Int, JsObject)]] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,actions[causes[upstreamBuild]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val triggeringBuild = (json \\ "upstreamBuild").headOption.map(_.as[Int])
      triggeringBuild.map(build =>
        (build, Json.obj(
          "status" -> mapBuildStatus((json \ "result").asOpt[String]),
          "link" -> s"$baseUrl/$buildNumber",
          "name" -> testName)))
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

  def fetchBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,culprits[fullName],changeSet[items[author[id]]],actions[parameters[value]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)

      val authors = (json \ "changeSet" \ "items").asOpt[List[JsValue]].getOrElse(List())
      val ids = authors.map(_ \ "author").distinct
      var parameter = null: JsValue;
      parameter = Json.toJson(buildNumber)
      try {
        parameter = (((json \ "actions").as[Array[JsValue]].take(1).last \ "parameters").as[Array[JsValue]].take(1).last \ "value")
      } catch { case e: Exception => }
      Json.obj(
        "status" -> mapBuildStatus((json \ "result").asOpt[String]),
        "number" -> buildNumber,
        "culprits" -> (json \ "culprits"),
        "authors" -> ids,
        "link" -> s"$baseUrl/$buildNumber",
        "DAILY_NUMBER" -> parameter)
    }
  }
}