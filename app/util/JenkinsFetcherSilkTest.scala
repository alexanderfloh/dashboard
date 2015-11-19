package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global

object JenkinsFetcherSilkTest {
  def prefix = "dashboard.silktest."

  def fetchCiBuilds(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlCi")
      .getOrElse(throw new RuntimeException(prefix + "urlTrunk not configured"))
    val nrOfRegressions = Play.current.configuration.getInt("dashboard.silktest.nrOfRegressions")
      .getOrElse(throw new RuntimeException("dashboard.silktest.nrOfRegressions not configured"))

    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]

      val regressionKeys = (1 to nrOfRegressions)
        .map(i => (s"urlRegressions${i}", s"regressionName${i}"))

      val regressionConfig = regressionKeys.map {
        case (urlKey, nameKey) =>
          val config = Play.current.configuration
          val url = config.getString(prefix + urlKey).getOrElse(throw new RuntimeException(s"$urlKey is not configured"))
          val name = config.getString(prefix + nameKey).getOrElse(throw new RuntimeException(s"$nameKey is not configured"))
          (url, name)
      }

      val regressionResults = Future.sequence(regressionConfig.map {
        case (url, name) => JenkinsFetcherUtil.fetchTests(url, name)
      })

      for {
        regression <- regressionResults
        lastCompletedDetails <- details
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "buildNumber").as[Int]

          val extracted = regression.map {
            case (name, result) =>
              val defaultStatus = Json.obj("status" -> "n/a", "name" -> name)
              result.getOrElse(buildNumber, defaultStatus)
          }

          jsVal + (("regressions", Json.toJson(extracted)))

        });
        Json.stringify(Json.obj(mapName -> detailsWithTests))
      }
    }
  }

  def fetchNightlyBuild(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlNightly")
      .getOrElse(throw new RuntimeException(prefix + "urlNightly not configured"))

    val setupUrl = Play.current.configuration.getString(prefix + "urlSetup")
      .getOrElse(throw new RuntimeException(prefix + "urlSetup not configured"))

    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)

      for {
        lastCompletedDetails <- details
        setupResult <- JenkinsFetcherUtil.fetchTests(setupUrl, "Setup")
      } yield {
        val lastBuildResultOpt = lastCompletedDetails match {
          case latest :: tail => Some(latest)
          case Nil => None
        }
        lastBuildResultOpt.map{ lastBuildResult => 
          val latestBuildNumber = (lastBuildResult \ "buildNumber").as[Int]
  
          val setupJson: JsValue = setupResult match {
            case (name, result) => result.getOrElse(latestBuildNumber, Json.obj("status" -> "n/a", "name" -> name))
          }
  
          val buildWithSetup = lastBuildResult + ("setup" -> setupJson)
  
          Json.stringify(Json.obj(mapName -> buildWithSetup))
        }.getOrElse(throw new RuntimeException("failed to fetch results"))
      }
    }
  }
}