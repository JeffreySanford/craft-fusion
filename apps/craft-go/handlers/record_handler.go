package handlers

import (
	"craft-fusion/craft-go/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetRecordsHandler serves user records based on limit.
// @Summary List records
// @Description Returns a generated list of records. Use the `limit` query parameter to control count.
// @Tags Records
// @Produce json
// @Param limit query int false "Maximum number of records to return (1-1000000)" default(1000)
// @Success 200 {object} RecordsResponse
// @Failure 400 {object} ErrorResponse
// @Router /api-go/records [get]
// @Router /api/records [get]
func GetRecordsHandler(c *gin.Context) {
	limitParam := c.DefaultQuery("limit", "1000")
	limit, err := strconv.Atoi(limitParam)
	if err != nil || limit <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	if limit > 1000000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Limit cannot exceed 1,000,000 records"})
		return
	}

	records := services.GetRecords(limit)
	c.JSON(http.StatusOK, gin.H{
		"records": records,
	})
}

// GetRecordByUIDHandler serves a user record based on UID.
// @Summary Get record by UID
// @Description Returns one record matching the provided UID.
// @Tags Records
// @Produce json
// @Param UID path string true "Record UID"
// @Success 200 {object} models.UserRecord
// @Failure 404 {object} ErrorResponse
// @Router /api-go/records/{UID} [get]
// @Router /api/records/{UID} [get]
func GetRecordByUIDHandler(c *gin.Context) {
	uid := c.Param("UID")
	record, err := services.GetRecordByUID(uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}
	c.JSON(http.StatusOK, record)
}
