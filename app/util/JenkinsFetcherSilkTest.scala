package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import models._

object JenkinsFetcherSilkTest {
  def prefix = "dashboard.silktest."

  def urlNightly = Play.current.configuration.getString(prefix + "urlNightly")
    .getOrElse(throw new RuntimeException(prefix + "urlNightly not configured"))

  def setupUrl = Play.current.configuration.getString(prefix + "urlSetup")
    .getOrElse(throw new RuntimeException(prefix + "urlSetup not configured"))

  def urlCi = Play.current.configuration.getString(prefix + "urlCi")
    .getOrElse(throw new RuntimeException(prefix + "urlTrunk not configured"))

  def nrOfRegressions = Play.current.configuration.getInt("dashboard.silktest.nrOfRegressions")
    .getOrElse(throw new RuntimeException("dashboard.silktest.nrOfRegressions not configured"))

  def fetchCiBuilds(mapName: String, numberOfItems: Integer): Future[String] = {
    for {
      (json, details) <- JenkinsFetcherUtil.getDetailsForJob(urlCi, numberOfItems)
      regressions <- fetchTests()
    } yield {

      val detailsWithTests = details.map(ciBuild => {
        val extracted = getTestStatus(regressions, ciBuild.buildNumber)

        implicit val writes = CiBuild.writes
        val ciBuildJson = Json.toJson(ciBuild).asInstanceOf[JsObject]
        ciBuildJson ++ Json.obj(("regressions", Json.toJson(extracted)))
      });
      Json.stringify(Json.obj(mapName -> detailsWithTests))
    }
  }

  def fetchTests() = {
    Future.sequence(getTestsConfig().map {
      case (url, name) => JenkinsFetcherUtil.fetchTests(url, name)
    })
  }
  
  def getTestsConfig() = {
    (1 to nrOfRegressions)
      .map(i => (s"urlRegressions$i", s"regressionName$i"))
      .toList
      .map {
        case (urlKey, nameKey) =>
          val config = Play.current.configuration
          val url = config.getString(prefix + urlKey).getOrElse(throw new RuntimeException(s"$urlKey is not configured"))
          val name = config.getString(prefix + nameKey).getOrElse(throw new RuntimeException(s"$nameKey is not configured"))
          (url, name)
      }
  }

  def getTestStatus(regressions: List[(String, Map[Int, JsValue])], buildNumber: Int) = {
    regressions.map {
      case (name, result) =>
        val defaultStatus = Json.obj("status" -> "n/a", "name" -> name)
        result.get(buildNumber).getOrElse(defaultStatus)
    }
  }

  def fetchNightlyBuild(mapName: String): Future[String] = {
    for {
      (_, lastCompletedDetails) <- JenkinsFetcherUtil.getDetailsForJob(urlNightly)
      (setupJson, _) <- JenkinsFetcherUtil.getDetailsForJob(setupUrl)
    } yield {
      val lastBuildResultOpt = lastCompletedDetails match {
        case latest :: tail => Some(latest)
        case Nil            => None
      }
      lastBuildResultOpt.map { lastBuildResult =>
        val latestBuildNumber = lastBuildResult.buildNumber

        implicit val writes = CiBuild.writes
        val buildWithSetup = Json.obj("setup" -> setupJson) ++
          Json.toJson(lastBuildResult).asInstanceOf[JsObject]

        Json.stringify(Json.obj(mapName -> buildWithSetup))
      }.getOrElse(throw new RuntimeException("failed to fetch results"))
    }
  }
}